import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { useLang } from "../../context/LangContext";
import { SvgIcon } from "../Icons";
import museumImage from "../../../background/muses4.jpg";
import { ticketText } from "./ticketText.mjs";
import {
  bookingTotal,
  guestCount,
  ticketToday,
  ticketLastDay,
  validVisitDate,
  isClosed,
  requestId,
  demoQr,
} from "./ticketModel.mjs";
import "./tickets.css";
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
async function api(path, body, signal) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(20000),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("API_ERROR");
  }
  if (!response.ok) {
    const error = Error(data.message || "API_ERROR");
    error.code = data.code;
    throw error;
  }
  return data;
}
const types = [
  ["adults", "adult", "adultNote", "adultPrice"],
  ["concessions", "concession", "concessionNote", "concessionPrice"],
  ["children", "child", "childNote", "childPrice"],
];
function useTicketLabels() {
  const { lang } = useLang();
  return {
    lang,
    t: (key) => ticketText(lang, key),
    money: (value) =>
      new Intl.NumberFormat(
        { vi: "vi-VN", en: "en-US", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR" }[
          lang
        ] || "vi-VN",
        { style: "currency", currency: "VND", maximumFractionDigits: 0 },
      ).format(value),
  };
}
function QrPanel({ order, t, money }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(demoQr(order), {
      width: 600,
      margin: 4,
      errorCorrectionLevel: "M",
    })
      .then((data) => {
        if (live) setImage(data);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [order.code, order.total]);
  return (
    <section className="ticket-payment" aria-labelledby="ticket-payment-title">
      <span className="ticket-chip">{t("demo")}</span>
      <h2 id="ticket-payment-title">{t("ready")}</h2>
      <p className="ticket-demo-note" role="status">
        {t("demoNote")}
      </p>
      {image ? (
        <img className="ticket-qr" src={image} alt={t("ready")} />
      ) : (
        <p role={error ? "alert" : "status"}>
          {t(error ? "unavailable" : "preparing")}
        </p>
      )}
      <dl>
        <div>
          <dt>{t("bookingCode")}</dt>
          <dd>{order.code}</dd>
        </div>
        <div>
          <dt>{t("total")}</dt>
          <dd>{money(order.total)}</dd>
        </div>
      </dl>
      <div className="ticket-actions">
        {image && (
          <a
            className="ticket-secondary"
            href={image}
            download={`${order.code}-DEMO.png`}
          >
            {t("downloadQr")}
          </a>
        )}
        <Link
          className="ticket-primary"
          to={`/tickets/confirmation/${order.reservationId}`}
        >
          {t("viewBooking")} <SvgIcon kind="arrow" size={18} />
        </Link>
      </div>
    </section>
  );
}
export default function Tickets() {
  const { lang, t, money } = useTicketLabels(),
    [params] = useSearchParams();
  const [offers, setOffers] = useState([]),
    [paymentReady, setPaymentReady] = useState(false),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [museumId, setMuseumId] = useState(params.get("museum") || ""),
    [date, setDate] = useState(""),
    [counts, setCounts] = useState({ adults: 1, concessions: 0, children: 0 }),
    [contact, setContact] = useState({ name: "", email: "" }),
    [accepted, setAccepted] = useState(false),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [order, setOrder] = useState(null);
  const key = useRef(null),
    heading = useRef(null),
    previousForm = useRef("");
  const selected = offers.find((o) => String(o.id) === museumId),
    total = selected ? bookingTotal(selected, counts) : 0,
    visitors = guestCount(counts),
    demo = selected?.isDemo || !paymentReady;
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setLoadError(false);
    api("/api/tickets/offers", null, c.signal)
      .then((data) => {
        if (c.signal.aborted) return;
        setOffers(data.items);
        setPaymentReady(data.paymentReady);
        if (data.items.length === 1) setMuseumId(String(data.items[0].id));
      })
      .catch(() => {
        if (!c.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    if (step || order) heading.current?.focus();
  }, [step, order]);
  function move(next) {
    setError("");
    setStep(next);
  }
  function next(event) {
    event.preventDefault();
    if (step === 0) {
      if (!selected) return setError(t("choose"));
      if (!validVisitDate(selected, date))
        return setError(t(isClosed(selected, date) ? "closed" : "invalidDate"));
      if (visitors < 1 || visitors > 20) return setError(t("invalidGuests"));
      move(1);
    } else if (step === 1) {
      if (!contact.name.trim() || !/^\S+@\S+\.\S+$/.test(contact.email))
        return setError(t("invalidContact"));
      move(2);
    }
  }
  async function checkout() {
    if (busy) return;
    if (!accepted) return setError(t("requiredTerms"));
    setBusy(true);
    setError("");
    const fingerprint = JSON.stringify({
      museumId,
      date,
      counts,
      contact,
      total,
    });
    if (!key.current || previousForm.current !== fingerprint) {
      key.current = requestId();
      previousForm.current = fingerprint;
    }
    try {
      const result = await api("/api/tickets/checkout", {
        requestId: key.current,
        museumId: Number(museumId),
        visitDate: date,
        ...counts,
        name: contact.name,
        email: contact.email,
        acceptTerms: true,
        expectedTotal: total,
        language: lang,
      });
      try {
        sessionStorage.setItem("muses-ticket-pending", result.reservationId);
      } catch {}
      if (result.mode === "Demo") {
        setOrder(result);
      } else if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
      } else {
        window.location.assign(`/tickets/confirmation/${result.reservationId}`);
      }
    } catch (e) {
      setError(
        lang === "vi" && e.message !== "API_ERROR"
          ? e.message
          : t("unavailable"),
      );
      if (e.code === "PAYMENT_EXPIRED") {
        key.current = null;
      }
      if (e.code === "PRICE_CHANGED") {
        setAttempt((n) => n + 1);
        setAccepted(false);
        setStep(0);
      }
    } finally {
      setBusy(false);
    }
  }
  function quantity(kind, change) {
    setCounts((old) => ({
      ...old,
      [kind]: Math.max(0, Math.min(20, old[kind] + change)),
    }));
    setAccepted(false);
    setError("");
  }
  return (
    <div className="tickets-page">
      <section className="tickets-hero">
        <div className="tickets-intro">
          <nav className="ticket-breadcrumb" aria-label={t("tickets")}>
            <Link to="/visit">{t("visit")}</Link>
            <span>/</span>
            <span>{t("tickets")}</span>
          </nav>
          <p className="ticket-eyebrow">MUSES · {t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p className="ticket-lead">{t("intro")}</p>
          <div className="ticket-hero-note">
            <SvgIcon kind="ticket" size={25} />
            <span>
              {t("plan")} <SvgIcon kind="arrow" size={16} />
            </span>
          </div>
        </div>
        <div className="tickets-hero-art">
          <img src={museumImage} alt={t("museum")} />
          <div className="ticket-art-caption">
            <span>MUSES</span>
            <p>ART. CULTURE. DISCOVERY.</p>
          </div>
        </div>
      </section>
      <section className="tickets-booking" aria-labelledby="ticket-form-title">
        <div className="ticket-main">
          <ol className="ticket-steps" aria-label={t("plan")}>
            {["plan", "details", "review"].map((key, index) => (
              <li
                key={key}
                className={
                  step === index
                    ? "is-current"
                    : step > index
                      ? "is-complete"
                      : ""
                }
                aria-current={step === index ? "step" : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {t(key)}
              </li>
            ))}
          </ol>
          <h2 id="ticket-form-title" ref={heading} tabIndex={-1}>
            {t(
              order
                ? "payment"
                : step === 0
                  ? "chooseMuseum"
                  : step === 1
                    ? "details"
                    : "review",
            )}
          </h2>
          {loading ? (
            <div className="ticket-state" role="status">
              {t("loading")}
            </div>
          ) : loadError ? (
            <div className="ticket-state" role="alert">
              <p>{t("unavailable")}</p>
              <button
                className="ticket-secondary"
                onClick={() => setAttempt((n) => n + 1)}
              >
                {t("retry")}
              </button>
            </div>
          ) : !offers.length ? (
            <div className="ticket-state">
              <p>{t("noOffers")}</p>
              <Link className="ticket-secondary" to="/museums">
                {t("museums")}
              </Link>
            </div>
          ) : order ? (
            <QrPanel order={order} t={t} money={money} />
          ) : (
            <form onSubmit={next} className="ticket-form">
              {step === 0 && (
                <>
                  <div className="ticket-two-fields">
                    <label>
                      {t("museum")}
                      <select
                        value={museumId}
                        onChange={(e) => {
                          setMuseumId(e.target.value);
                          setAccepted(false);
                          setError("");
                        }}
                        required
                      >
                        <option value="">{t("choose")}</option>
                        {offers.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("date")}
                      <input
                        type="date"
                        value={date}
                        min={ticketToday()}
                        max={ticketLastDay()}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setAccepted(false);
                          setError("");
                        }}
                        required
                      />
                    </label>
                  </div>
                  <p className="ticket-hint">
                    {selected?.address || t("dateHint")}
                  </p>
                  <h3>{t("selectTickets")}</h3>
                  <div className="ticket-types">
                    {types.map(([kind, title, note, price]) => (
                      <div className="ticket-type" key={kind}>
                        <div>
                          <h4>{t(title)}</h4>
                          <p>{t(note)}</p>
                        </div>
                        <div className="ticket-unit-price">
                          {selected
                            ? selected[price] === 0
                              ? t("free")
                              : money(selected[price])
                            : "—"}
                          <small>{t("perTicket")}</small>
                        </div>
                        <div className="ticket-quantity">
                          <button
                            type="button"
                            aria-label={`${t("decrease")}: ${t(title)}`}
                            disabled={counts[kind] === 0}
                            onClick={() => quantity(kind, -1)}
                          >
                            −
                          </button>
                          <output aria-label={t(title)}>{counts[kind]}</output>
                          <button
                            type="button"
                            aria-label={`${t("increase")}: ${t(title)}`}
                            disabled={visitors >= 20}
                            onClick={() => quantity(kind, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="ticket-hint">{t("maxGuests")}</p>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="ticket-contact-hint">{t("contactHint")}</p>
                  <label>
                    {t("name")}
                    <input
                      value={contact.name}
                      autoComplete="name"
                      maxLength={150}
                      required
                      onChange={(e) =>
                        setContact((old) => ({ ...old, name: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {t("email")}
                    <input
                      type="email"
                      value={contact.email}
                      autoComplete="email"
                      maxLength={255}
                      required
                      onChange={(e) =>
                        setContact((old) => ({ ...old, email: e.target.value }))
                      }
                    />
                  </label>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="ticket-review-box">
                    <div>
                      <h3>{t("plan")}</h3>
                      <button type="button" onClick={() => move(0)}>
                        {t("edit")} ↗
                      </button>
                    </div>
                    <strong>{selected?.name}</strong>
                    <p>{selected?.address}</p>
                    <p>
                      {date} · {visitors} {t("guests")}
                    </p>
                  </div>
                  <div className="ticket-review-box">
                    <div>
                      <h3>{t("details")}</h3>
                      <button type="button" onClick={() => move(1)}>
                        {t("edit")} ↗
                      </button>
                    </div>
                    <p>{contact.name}</p>
                    <p>{contact.email}</p>
                  </div>
                  <div className="ticket-payment-method">
                    <SvgIcon kind="qr" size={25} />
                    <div>
                      <strong>{t("qrMethod")}</strong>
                      {demo && <p>{t("demoNote")}</p>}
                    </div>
                  </div>
                  <label className="ticket-agree">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <span>{t("agree")}</span>
                  </label>
                </>
              )}
              {error && (
                <p className="ticket-error" role="alert">
                  {error}
                </p>
              )}
              <div className="ticket-form-actions">
                {step > 0 && (
                  <button
                    className="ticket-back"
                    type="button"
                    disabled={busy}
                    onClick={() => move(step - 1)}
                  >
                    ← {t("back")}
                  </button>
                )}
                {step < 2 ? (
                  <button
                    className="ticket-primary"
                    type="submit"
                    disabled={!selected}
                  >
                    {t("continue")} <SvgIcon kind="arrow" size={20} />
                  </button>
                ) : (
                  <button
                    className="ticket-primary"
                    type="button"
                    disabled={busy}
                    onClick={checkout}
                  >
                    {busy ? t("preparing") : t(demo ? "createQr" : "pay")}{" "}
                    <SvgIcon kind="arrow" size={20} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
        <aside className="ticket-summary">
          <div className="ticket-summary-top">
            <SvgIcon kind="ticket" size={28} />
            <span>MUSES</span>
          </div>
          <div className="ticket-summary-body">
            <p className="ticket-eyebrow">{t("summary")}</p>
            <h3>{selected?.name || t("tickets")}</h3>
            <p>{date || t("chooseDate")}</p>
            <div className="ticket-perforation" />
            {types
              .filter(([kind]) => counts[kind] > 0)
              .map(([kind, title, , price]) => (
                <div className="ticket-summary-line" key={kind}>
                  <span>
                    {t(title)} × {counts[kind]}
                  </span>
                  <strong>
                    {selected ? money(counts[kind] * selected[price]) : "—"}
                  </strong>
                </div>
              ))}
            <div className="ticket-summary-total" aria-live="polite">
              <span>{t("total")}</span>
              <strong>{selected ? money(total) : "—"}</strong>
            </div>
            <p className="ticket-hint">{t("currency")}</p>
            {selected?.terms && (
              <div className="ticket-conditions">
                <h4>{t("terms")}</h4>
                <p>{selected.terms}</p>
              </div>
            )}
            <p className="ticket-summary-note">{t("secureNote")}</p>
          </div>
        </aside>
      </section>
      <section className="ticket-faq">
        <div>
          <p className="ticket-eyebrow">MUSES · FAQ</p>
          <h2>{t("faqTitle")}</h2>
        </div>
        <div>
          {[1, 2, 3].map((n) => (
            <details key={n}>
              <summary>
                {t(`faq${n}`)}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{t(`faq${n}a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
export function TicketReceipt() {
  const { id } = useParams(),
    { t, money } = useTicketLabels();
  let stored = "";
  try {
    stored = sessionStorage.getItem("muses-ticket-pending") || "";
  } catch {}
  const receiptId = id || stored,
    [data, setData] = useState(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    let timer;
    setError(false);
    setData(null);
    async function refresh() {
      try {
        if (!receiptId) throw Error("NOT_FOUND");
        const row = await api(
          `/api/tickets/reservations/${encodeURIComponent(receiptId)}`,
          null,
          c.signal,
        );
        if (c.signal.aborted) return;
        setData(row);
        if (row.paymentState === "Pending" && !row.isDemoPayment)
          timer = setTimeout(refresh, 5000);
      } catch {
        if (!c.signal.aborted) setError(true);
      }
    }
    void refresh();
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [receiptId, attempt]);
  const paid = ["Paid", "NotRequired"].includes(data?.paymentState);
  const status =
    data?.paymentState === "NotRequired"
      ? "free"
      : data?.paymentState === "Failed"
        ? "failed"
        : data?.paymentState === "Expired"
          ? "expired"
          : paid
            ? "paid"
            : "pending";

  return (
    <section className="ticket-receipt-page">
      <div className="ticket-receipt">
        <p className="ticket-eyebrow">MUSES · {t("receipt")}</p>
        <SvgIcon kind="ticket" size={42} />
        <h1>{t("receipt")}</h1>
        {error ? (
          <p role="alert">
            {t("unavailable")}{" "}
            <button onClick={() => setAttempt((n) => n + 1)}>
              {t("retry")}
            </button>
          </p>
        ) : !data ? (
          <p role="status">{t("loading")}</p>
        ) : (
          <>
            <p
              className={`ticket-payment-status ${paid ? "is-paid" : ""}`}
              role="status"
            >
              {t(status)}
            </p>
            {data.isDemoPayment && (
              <p className="ticket-demo-note">{t("demoNote")}</p>
            )}
            <h2>{data.museum}</h2>
            <p>{data.address}</p>
            <dl>
              {[
                [t("bookingCode"), data.code],
                [t("date"), data.visitDate],
                [t("guests"), data.adults + data.concessions + data.children],
                [t("total"), money(data.total)],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="ticket-actions">
              <button
                className="ticket-secondary"
                onClick={() => window.print()}
              >
                {t("print")}
              </button>
              <Link className="ticket-primary" to="/tickets">
                {t("newBooking")}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
