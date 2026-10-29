// Existing reservation receipts remain readable; the public /tickets route is PriceLookup.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLang } from "../../context/LangContext";
import { catalog } from "../../api/catalog.mjs";
import { SvgIcon } from "../Icons";
import { ticketText } from "./ticketText.mjs";
import { priceText } from "./priceText.mjs";
import "./tickets.css";
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
export function TicketReceipt() {
  const { id } = useParams(),
    { t, money, lang } = useTicketLabels();
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
        const row = await catalog(
          `/api/tickets/reservations/${encodeURIComponent(receiptId)}`,
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
                {priceText(lang, "title")}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
