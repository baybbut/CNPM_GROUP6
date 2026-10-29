const LANGUAGES = ["vi", "en", "zh", "ja", "ko"];
class CatalogError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (message, status = 400, code = "INVALID_DATA") => {
  throw new CatalogError(status, code, message);
};
function text(value, name, max, required = false) {
  if (value == null && !required) return null;
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    fail(`${name} không hợp lệ (tối đa ${max} ký tự).`);
  return value.trim() || null;
}
function id(value, name = "Mã") {
  if (
    !/^[1-9]\d*$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 2147483647
  )
    fail(`${name} không hợp lệ.`);
  return Number(value);
}
function date(value, required = true) {
  if (!value && !required) return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "0001-01-01"
  )
    fail("Ngày không hợp lệ.");
  const d = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== value)
    fail("Ngày không hợp lệ.");
  return value;
}
const todayVN = (now = new Date()) =>
  new Date(+now + 420 * 60000).toISOString().slice(0, 10);
const overlaps = (a, b) =>
  (!b.endDate || a.startDate < b.endDate) &&
  (!a.endDate || b.startDate < a.endDate);
const isCurrent = (s, today = todayVN()) =>
  s.status === "Confirmed" &&
  Boolean(s.isPublic) &&
  s.startDate <= today &&
  (!s.endDate || today < s.endDate);
function url(value, name = "Đường dẫn") {
  if (!value) return null;
  const v = text(value, name, 500, true);
  if (/^\/images\/[A-Za-z0-9_./%\-]+$/.test(v) && !v.includes("..")) return v;
  try {
    const u = new URL(v);
    if (["http:", "https:"].includes(u.protocol) && !u.username && !u.password)
      return v;
  } catch {}
  fail(`${name} phải là URL http(s) hoặc đường dẫn /images/.`);
}
function language(value = "vi") {
  if (!LANGUAGES.includes(value)) fail("Ngôn ngữ hỗ trợ: vi, en, zh, ja, ko.");
  return value;
}
function status(value, allowed = ["Draft", "Published", "Hidden"]) {
  if (!allowed.includes(value)) fail("Trạng thái không hợp lệ.");
  return value;
}
function museum(body) {
  if (
    (body.isPublic != null && typeof body.isPublic !== "boolean") ||
    (body.pinVerified != null && typeof body.pinVerified !== "boolean")
  )
    fail("Trạng thái công khai và kiểm chứng ghim phải là boolean.");
  const lat = Number(body.latitude),
    lng = Number(body.longitude);
  if (
    body.latitude == null ||
    body.latitude === "" ||
    body.longitude == null ||
    body.longitude === "" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  )
    fail("Vĩ độ phải trong [-90,90], kinh độ trong [-180,180].");
  if (body.isPublic && !body.pinVerified)
    fail("Kiểm tra ghim khớp địa chỉ trước khi công khai bảo tàng.");
  return {
    name: text(body.name, "Tên bảo tàng", 250, true),
    address: text(body.address, "Địa chỉ", 500, true),
    description: text(body.description, "Mô tả", 4000),
    contact: text(body.contact, "Liên hệ", 500),
    latitude: lat,
    longitude: lng,
    isPublic: body.isPublic === true,
    pinVerified: body.pinVerified === true,
    source: text(body.source, "Nguồn", 1000, body.isPublic === true),
  };
}
function schedule(body) {
  const startDate = date(body.startDate),
    endDate = date(body.endDate, false),
    verifiedOn = date(body.verifiedOn);
  if (endDate && startDate >= endDate)
    fail("Ngày kết thúc phải sau ngày bắt đầu (không bao gồm ngày kết thúc).");
  if (verifiedOn > todayVN()) fail("Ngày kiểm chứng không thể ở tương lai.");
  return {
    artworkId: id(body.artworkId, "Tác phẩm"),
    museumId: id(body.museumId, "Bảo tàng"),
    startDate,
    endDate,
    status: status(body.status, ["Draft", "Confirmed", "Cancelled"]),
    source: text(body.source, "Nguồn trưng bày", 1000, true),
    verifiedOn,
  };
}
function artwork(body) {
  const imageUrl = url(body.imageUrl, "Ảnh đại diện");
  if (body.status === "Published" && !imageUrl)
    fail("Cần ảnh đại diện trước khi công bố tác phẩm.");
  return {
    imageUrl,
    imageSource: text(body.imageSource, "Nguồn / quyền sử dụng ảnh", 1000),
    title: text(body.title, "Tên tác phẩm", 250, true),
    artistId: id(body.artistId, "Tác giả"),
    categoryId: id(body.categoryId, "Thể loại"),
    materialId: id(body.materialId, "Chất liệu"),
    creationPeriod: text(body.creationPeriod, "Năm / giai đoạn", 150),
    dimensions: text(body.dimensions, "Kích thước", 100),
    source: text(body.source, "Nguồn thông tin", 1000),
    ownerMuseumId: body.ownerMuseumId ? id(body.ownerMuseumId) : null,
    status: status(body.status),
  };
}
function translation(body) {
  const state = status(body.status, ["Draft", "Published"]);
  return {
    artworkId: id(body.artworkId),
    language: language(body.language),
    title: text(body.title, "Tên bản dịch", 250, state === "Published"),
    description: text(body.description, "Mô tả", 12000, state === "Published"),
    shortDescription: text(body.shortDescription, "Mô tả ngắn", 1000),
    source: text(body.source, "Nguồn bản dịch", 1000),
    audioUrl: url(body.audioUrl, "Âm thanh"),
    status: state,
  };
}
module.exports = {
  LANGUAGES,
  CatalogError,
  fail,
  text,
  id,
  date,
  url,
  status,
  language,
  museum,
  schedule,
  artwork,
  translation,
  todayVN,
  overlaps,
  isCurrent,
};
