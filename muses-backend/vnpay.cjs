const crypto = require("node:crypto");
function configured(env = process.env) {
  return Boolean(
    env.TICKET_PAYMENT_MODE === "vnpay" &&
      env.VNPAY_TMN_CODE &&
      env.VNPAY_HASH_SECRET &&
      env.VNPAY_RETURN_URL,
  );
}
function stamp(now = new Date()) {
  return new Date(+now + 420 * 60000)
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);
}
function canonical(params) {
  return Object.keys(params)
    .filter((k) => k !== "vnp_SecureHash" && k !== "vnp_SecureHashType")
    .sort()
    .map(
      (k) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k])).replace(/%20/g, "+")}`,
    )
    .join("&");
}
function signature(params, secret) {
  return crypto
    .createHmac("sha512", secret)
    .update(canonical(params), "utf8")
    .digest("hex");
}
function verify(params, env = process.env) {
  if (
    !configured(env) ||
    !params ||
    Object.entries(params).some(
      ([k, v]) => !k.startsWith("vnp_") || typeof v !== "string",
    ) ||
    !/^[a-f\d]{128}$/i.test(params.vnp_SecureHash || "") ||
    params.vnp_TmnCode !== env.VNPAY_TMN_CODE
  )
    return false;
  const expected = Buffer.from(signature(params, env.VNPAY_HASH_SECRET), "hex"),
    actual = Buffer.from(params.vnp_SecureHash, "hex");
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}
function checkoutUrl(
  order,
  { ip = "127.0.0.1", language = "vi", env = process.env } = {},
) {
  if (!configured(env)) throw Error("PAYMENT_NOT_CONFIGURED");
  const target = new URL(
    env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  );
  if (target.protocol !== "https:") throw Error("PAYMENT_URL_MUST_USE_HTTPS");
  const ret = new URL(env.VNPAY_RETURN_URL);
  if (
    !["http:", "https:"].includes(ret.protocol) ||
    ret.username ||
    ret.password
  )
    throw Error("INVALID_PAYMENT_RETURN_URL");
  const values = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env.VNPAY_TMN_CODE,
    vnp_Amount: String(order.total * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: order.code,
    vnp_OrderInfo: `Thanh toan ve Muses ${order.code}`,
    vnp_OrderType: "other",
    vnp_Locale: language === "vi" ? "vn" : "en",
    vnp_ReturnUrl: ret.href,
    vnp_IpAddr: ip.replace(/^::ffff:/, ""),
    vnp_CreateDate: stamp(new Date(order.createdAt)),
    vnp_ExpireDate: stamp(new Date(order.expiresAt)),
  };
  target.search =
    canonical(values) +
    "&vnp_SecureHash=" +
    signature(values, env.VNPAY_HASH_SECRET);
  return target.href;
}
module.exports = {
  configured,
  stamp,
  canonical,
  signature,
  verify,
  checkoutUrl,
};
