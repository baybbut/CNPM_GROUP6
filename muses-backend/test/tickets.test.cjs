const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express"),
  sql = require("mssql"),
  crypto = require("node:crypto");
const {
  attachTicketRoutes,
  validateBooking,
  ticketTotal,
} = require("../tickets.cjs");
const VNPAY = require("../vnpay.cjs");
const { todayVN } = require("../catalog-rules.cjs");
const body = () => ({
  requestId: crypto.randomUUID(),
  museumId: 1,
  visitDate: todayVN(),
  adults: 2,
  concessions: 1,
  children: 1,
  name: "Test visitor",
  email: "visitor@tickets.invalid",
  acceptTerms: true,
  expectedTotal: 100000,
});
const offer = {
  id: 1,
  name: "Demo museum",
  adultPrice: 40000,
  concessionPrice: 20000,
  childPrice: 0,
  closedWeekdays: "",
  isDemo: true,
  isEnabled: true,
  terms: "Demo terms",
};
test("booking quantities, date, contact and consent are validated; total uses server prices", () => {
  assert.equal(ticketTotal(offer, body()), 100000);
  assert.equal(validateBooking(body()).email, "visitor@tickets.invalid");
  for (const change of [
    { adults: -1 },
    { adults: 21 },
    { adults: 1.5 },
    { adults: 0, concessions: 0, children: 0 },
    { visitDate: "2020-01-01" },
    { visitDate: "2026-02-30" },
    { email: "bad" },
    { acceptTerms: false },
    { expectedTotal: -1 },
  ])
    assert.throws(() => validateBooking({ ...body(), ...change }));
});
test("gateway signature rejects tampering; demo mode cannot enable charges", () => {
  const env = {
    TICKET_PAYMENT_MODE: "vnpay",
    VNPAY_TMN_CODE: "FIXTURE",
    VNPAY_HASH_SECRET: "test-only-secret",
    VNPAY_RETURN_URL: "http://localhost/tickets/result",
  };
  const order = {
    code: "MUS-1234567890123456",
    total: 100000,
    createdAt: new Date("2026-10-29T01:00:00Z"),
    expiresAt: new Date("2026-10-29T01:15:00Z"),
  };
  const url = new URL(VNPAY.checkoutUrl(order, { env })),
    p = Object.fromEntries(url.searchParams);
  assert.equal(p.vnp_Amount, "10000000");
  assert.equal(p.vnp_CreateDate, "20261029080000");
  assert.equal(VNPAY.verify(p, env), true);
  assert.equal(VNPAY.verify({ ...p, vnp_Amount: "1" }, env), false);
  assert.equal(VNPAY.verify(p, { ...env, TICKET_PAYMENT_MODE: "demo" }), false);
  assert.equal(
    VNPAY.canonical({ vnp_b: "x y", vnp_a: "a/b" }),
    "vnp_a=a%2Fb&vnp_b=x+y",
  );
});
let server,
  origin,
  role = null;
const orders = new Map();
let saved = 0;
let priceQuery = "";
const originalMode = process.env.TICKET_PAYMENT_MODE;
before(async () => {
  process.env.TICKET_PAYMENT_MODE = "demo";
  const app = express();
  app.use(express.json());
  app.locals.identity = async () => (role ? { id: 1, role } : null);
  function request() {
    const values = {};
    return {
      input(name, type, value) {
        values[name] = value;
        return this;
      },
      async query(statement) {
        if (statement.includes("LEFT JOIN dbo.TicketOffers")) {
          priceQuery = statement;
          return {
            recordset: [
              {
                id: 1,
                name: "Real museum",
                adultPrice: 40000,
                concessionPrice: 20000,
                childPrice: 0,
              },
              {
                id: 2,
                name: "Not priced yet",
                adultPrice: null,
                concessionPrice: null,
                childPrice: null,
              },
            ],
          };
        }
        if (statement.startsWith("SELECT BookingCode AS code"))
          return {
            recordset: orders.has(values.requestId)
              ? [orders.get(values.requestId)]
              : [],
          };
        if (statement.includes("PaymentState AS state")) {
          const o = [...orders.values()].find(
            (row) => row.code === values.code,
          );
          return { recordset: o ? [{ ...o, state: o.paymentState }] : [] };
        }
        if (statement.includes("INSERT INTO dbo.TicketReservations")) {
          saved++;
          orders.set(values.requestId, { ...values, requestHash: values.hash });
          return { recordset: [] };
        }
        if (statement.includes("WHERE r.ReservationID=@id")) {
          const o = orders.get(values.id);
          return {
            recordset: o
              ? [
                  {
                    code: o.code,
                    total: o.total,
                    isDemoPayment: o.isDemoPayment,
                    paymentState: o.paymentState,
                    expiresAt: o.expires,
                    museum: "Demo museum",
                    visitDate: o.visitDate,
                    adults: o.adults,
                    concessions: o.concessions,
                    children: o.children,
                  },
                ]
              : [],
          };
        }
        return { recordset: [offer] };
      },
    };
  }
  app.locals.pool = {
    request,
    transaction() {
      return {
        request,
        async begin() {},
        async commit() {},
        async rollback() {},
      };
    },
  };
  attachTicketRoutes(app, sql);
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (originalMode === undefined) delete process.env.TICKET_PAYMENT_MODE;
  else process.env.TICKET_PAYMENT_MODE = originalMode;
  await new Promise((r) => server.close(r));
});
const post = (b) =>
  fetch(origin + "/api/tickets/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });
test("sample checkout persists once, retries are idempotent and never report paid", async () => {
  const b = body(),
    one = await post(b);
  assert.equal(one.status, 201);
  const order = await one.json();
  assert.equal(order.mode, "Demo");
  assert.equal(order.paymentState, "Pending");
  assert.equal(order.redirectUrl, undefined);
  assert.match(order.code, /^MUS-[A-F0-9]{16}$/);
  assert.equal((await post(b)).status, 200);
  assert.equal(saved, 1);
  assert.equal((await post({ ...b, name: "Different visitor" })).status, 409);
  const receipt = await (
    await fetch(origin + "/api/tickets/reservations/" + b.requestId)
  ).json();
  assert.equal(receipt.isDemoPayment, true);
  assert.equal(receipt.paymentState, "Pending");
  assert.equal(receipt.email, undefined);
});
test("client cannot lower server price; closed days reject checkout", async () => {
  assert.equal((await post({ ...body(), expectedTotal: 1 })).status, 409);
  offer.closedWeekdays = String(new Date(todayVN() + "T00:00:00Z").getUTCDay());
  assert.equal((await post(body())).status, 409);
  offer.closedWeekdays = "";
});
test("forged callback cannot confirm a ticket", async () => {
  const response = await fetch(
    origin +
      "/api/tickets/vnpay/ipn?vnp_TxnRef=MUS-1234567890123456&vnp_ResponseCode=00&vnp_TransactionStatus=00&vnp_Amount=10000000&vnp_SecureHash=bad",
  );
  assert.equal((await response.json()).RspCode, "97");
  assert.equal(
    [...orders.values()].every((o) => o.paymentState === "Pending"),
    true,
  );
});
test("Admin ticket endpoints require server-side role checks", async () => {
  for (role of [null, "Visitor"])
    for (const endpoint of ["offers", "reservations"])
      assert.equal(
        (await fetch(origin + "/api/admin/tickets/" + endpoint)).status,
        role ? 403 : 401,
      );
  role = "Admin";
  assert.equal((await fetch(origin + "/api/admin/tickets/offers")).status, 200);
});

test("even a valid signed callback cannot turn a demo QR into a paid ticket", async () => {
  const names = [
    "TICKET_PAYMENT_MODE",
    "VNPAY_TMN_CODE",
    "VNPAY_HASH_SECRET",
    "VNPAY_RETURN_URL",
  ];
  const original = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    Object.assign(process.env, {
      TICKET_PAYMENT_MODE: "vnpay",
      VNPAY_TMN_CODE: "FIXTURE",
      VNPAY_HASH_SECRET: "test-only-secret",
      VNPAY_RETURN_URL: "http://localhost/tickets/result",
    });
    const o = [...orders.values()][0];
    const p = {
      vnp_TmnCode: "FIXTURE",
      vnp_TxnRef: o.code,
      vnp_Amount: String(o.total * 100),
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
      vnp_TransactionNo: "123456",
    };
    p.vnp_SecureHash = VNPAY.signature(p, "test-only-secret");
    const response = await fetch(
      origin + "/api/tickets/vnpay/ipn?" + new URLSearchParams(p),
    );
    assert.equal((await response.json()).RspCode, "01");
    assert.equal(o.paymentState, "Pending");
  } finally {
    for (const k of names) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  }
});

test("public price lookup is guest-readable, includes unknown prices and never creates an order", async () => {
  role = null;
  const beforeSaved = saved;
  const response = await fetch(`${origin}/api/tickets/prices`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.items[0].childPrice, 0);
  assert.equal(data.items[1].adultPrice, null);
  assert.match(priceQuery, /m.IsPublic=1 AND m.IsDemo=0/);
  assert.match(priceQuery, /t.IsEnabled=1/);
  assert.equal(saved, beforeSaved);
});
