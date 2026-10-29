import exhibition from "../../tranh/HOANHACTRONGGIADINHOHUE.jpg";
import galleries from "../../background/muses4.jpg";
import visitor from "../../background/muses6.jpg";

// Keep announcement dates in ISO format; the latest announcements appear first.
export const MUSEUM_NEWS = [
  {
    slug: "trien-lam-co-do-than-yeu",
    date: "2026-10-23",
    image: exhibition,
    vi: {
      category: "Triển lãm",
      title: "Hẹn gặp bạn tại triển lãm “Cố đô thân yêu”",
      summary:
        "Khám phá những câu chuyện về cố đô qua nghệ thuật. Triển lãm dự kiến diễn ra từ 04/11/2026 đến 10/05/2027.",
      sections: [
        {
          heading: "Một cuộc hẹn với nghệ thuật và ký ức",
          text: "Triển lãm “Cố đô thân yêu” hướng sự chú ý đến vẻ đẹp văn hóa, đời sống và những ký ức gắn với vùng đất cố đô. Đây là dịp để người xem tiếp cận các câu chuyện văn hóa qua ngôn ngữ của nghệ thuật.",
        },
        {
          heading: "Thông tin dành cho khách tham quan",
          text: "Thời gian dự kiến: từ ngày 04 tháng 11 năm 2026 đến ngày 10 tháng 05 năm 2027. Bạn có thể xem thêm mục Triển lãm và Sự kiện để chuẩn bị lịch tham quan và theo dõi các cập nhật liên quan.",
        },
      ],
      cta: "Xem triển lãm và sự kiện",
    },
    en: {
      category: "Exhibitions",
      title: "Discover “My Beloved Ancient Capital”",
      summary:
        "Explore stories of the ancient capital through art. The exhibition is scheduled for 4 November 2026 – 10 May 2027.",
      sections: [
        {
          heading: "Art, culture and memory",
          text: "“My Beloved Ancient Capital” invites visitors to reflect on the culture, everyday life and memories associated with the ancient capital, exploring these stories through art.",
        },
        {
          heading: "Plan your visit",
          text: "The exhibition is scheduled to run from 4 November 2026 to 10 May 2027. Visit Exhibitions and Events for the programme and further updates before planning your trip.",
        },
      ],
      cta: "Explore exhibitions and events",
    },
    href: "/exhibition",
  },
  {
    slug: "thong-tin-chuan-bi-tham-quan",
    date: "2026-10-22",
    image: galleries,
    vi: {
      category: "Thông báo",
      title: "Chuẩn bị chuyến tham quan Muses của bạn",
      summary:
        "Cập nhật giờ mở cửa, xem hướng dẫn di chuyển và tìm hiểu các tiện ích trước khi đến bảo tàng.",
      sections: [
        {
          heading: "Kiểm tra giờ mở cửa trước chuyến đi",
          text: "Khung giờ tham quan đang được giới thiệu trên website là 09:00 – 21:00. Trước khi đến, bạn nên kiểm tra lại thông tin tại mục Tham quan và các thông báo mới của bảo tàng để chủ động sắp xếp lịch trình.",
        },
        {
          heading: "Tận hưởng không gian bảo tàng",
          text: "Trang Tham quan tập hợp thông tin về đường đi, sơ đồ và các tiện ích dành cho khách. Khi tham quan, vui lòng giữ trật tự, không chạm vào hiện vật và làm theo hướng dẫn tại khu vực trưng bày.",
        },
      ],
      cta: "Chuẩn bị chuyến thăm",
    },
    en: {
      category: "Visitor notices",
      title: "Plan your visit to Muses",
      summary:
        "Check opening hours, directions and visitor facilities before your trip to the museum.",
      sections: [
        {
          heading: "Check the latest opening information",
          text: "The visiting hours currently advertised on the website are 9:00 AM – 9:00 PM. Please check the Visit page and the latest museum notices before travelling.",
        },
        {
          heading: "Enjoy the museum at your own pace",
          text: "The Visit page brings together directions, maps and visitor facilities. Please keep noise to a minimum, avoid touching artworks and follow guidance in the galleries.",
        },
      ],
      cta: "Plan your visit",
    },
    href: "/visit",
  },
  {
    slug: "kham-pha-tac-pham-bang-ma-qr",
    date: "2026-10-21",
    image: visitor,
    vi: {
      category: "Trải nghiệm",
      title: "Khám phá câu chuyện tác phẩm qua mã QR",
      summary:
        "Mở thông tin tác phẩm, chọn ngôn ngữ và nghe thuyết minh ngay trên thiết bị của bạn.",
      sections: [
        {
          heading: "Từ mã QR đến câu chuyện nghệ thuật",
          text: "Tại mục Quét QR, bạn có thể quét mã của tác phẩm hoặc chọn ảnh mã QR để mở trang chi tiết. Trang tác phẩm giới thiệu hình ảnh, nghệ sĩ, chất liệu và nội dung mô tả.",
        },
        {
          heading: "Chọn ngôn ngữ và nghe thuyết minh",
          text: "Bạn có thể chọn tiếng Việt, tiếng Anh, tiếng Pháp, tiếng Nhật hoặc tiếng Trung cho nội dung tác phẩm. Khi nội dung và giọng đọc tương ứng có sẵn, hãy bấm Đọc văn bản để nghe và theo dõi phần thuyết minh. Nếu bản dịch chưa có, bạn vẫn có thể xem và nghe bản gốc.",
        },
      ],
      cta: "Quét QR tác phẩm",
    },
    en: {
      category: "Museum experiences",
      title: "Explore artwork stories with QR codes",
      summary:
        "Open an artwork, choose your content language and listen to its story on your own device.",
      sections: [
        {
          heading: "A small code opens an artwork’s story",
          text: "Use Scan QR to scan an artwork code or upload a QR image. The artwork page brings together its image, artist, material and description.",
        },
        {
          heading: "Choose a language and listen",
          text: "Artwork content supports Vietnamese, English, French, Japanese and Chinese. When the matching text and voice are available, select Read aloud to listen and follow the narration. If a translation is unavailable, you can still explore and listen to the original.",
        },
      ],
      cta: "Scan an artwork QR",
    },
    href: "/scan",
  },
].sort((a, b) => b.date.localeCompare(a.date));
export const newsCopy = (article, lang) => article[lang === "vi" ? "vi" : "en"];
export function newsDate(date, lang) {
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
