/* Chèn ảnh: import ảnh rồi điền vào `img`, giống data.js, ví dụ:
   import tranh1 from "../../tranh/ten-anh.jpg";   rồi   img: tranh1 */
import exploreHero from "../../background/muses4.jpg";
export const HERO_IMG = exploreHero;
import collectionCover from "../../tranh/tranhsonmai/GIAOMUA.jpg";

export const COLLECTIONS_CARD = {
  title: "The Collections",
  img: collectionCover,
  color: "#a8301a",
};

export const INTRO = [
  "At Muses, art opens a window onto the lives, memories and imagination of those who came before us. A painting, a carved wooden figure or a ceramic vessel can each tell a story—of everyday life, of love and longing, or of a world seen through an artist’s eyes. Bringing these works together invites us to discover beauty across different materials and forms, and to recognise the connections between artistic expression and the experiences we share.",
  "Exploring the collections means looking beyond what first meets the eye. A gesture may reveal an emotion; a pattern may carry a tradition; a familiar scene may offer an unexpected view of the past. At Muses, visitors are invited to follow their curiosity, move between artworks and discover how different generations of artists have interpreted the world around them. Each encounter offers an opportunity to reflect on what has changed, what endures and what continues to move us.",
  "Through the Muses website and mobile app, this journey extends beyond the museum walls. Visitors can explore artworks, learn about their creators and discover the museum in their preferred language. By making these stories accessible to people from different backgrounds, Muses invites everyone to look closer, ask questions and find a personal connection with art.",
];

export const COLLECTIONS = [
  { id: 1, title: "Lacquer Painting Collection", img: "", color: "#b5533c" },
  { id: 2, title: "Oil Painting Collection", img: "", color: "#6f8f7a" },
  { id: 3, title: "Sculpture Collection", img: "", color: "#6b4a22" },
];

export const THEMES = [
  { id: 1, title: "Masterpieces of Vietnamese Oil Painting", img: "", color: "#b9b3c4" },
  { id: 2, title: "Vietnamese Culture Through the Eyes of International Artists", img: "", color: "#8fa8a0" },
  { id: 3, title: "Artworks Celebrating Vietnamese Customs and Traditions", img: "", color: "#a8741f" },
  { id: 4, title: "Masterpieces of Vietnamese Sculpture", img: "", color: "#6b4a22" },
  { id: 5, title: "Lacquer Paintings Celebrating Festivals", img: "", color: "#c4552d" },
  { id: 6, title: "The Beauty of Women Through the Eyes of Young Artists", img: "", color: "#d99a2b" },
  { id: 7, title: "Masterpieces of Lacquer Painting", img: "", color: "#b0506a" },
  { id: 8, title: "Artworks Celebrating the Spirit and Beauty of Vietnamese Soldiers", img: "", color: "#8a3a2a" },
];

export const MAP = { title: "INTERACTIVE MAPS OF THE MUSEUM", img: "", color: "#c9c3a8" };

export const EXPLORE_COPY = {
  en: {
    home: "Home",
    collectionTitle: "The Collections",
    intro: INTRO,
  },

  vi: {
    home: "Trang chủ",
    collectionTitle: "Bộ sưu tập",
    intro: [
      "Tại Muses, nghệ thuật mở ra một góc nhìn về cuộc sống, ký ức và trí tưởng tượng của những thế hệ đi trước. Một bức tranh, một pho tượng gỗ hay một chiếc bình gốm đều có thể kể câu chuyện về đời sống thường ngày, tình yêu, nỗi nhớ hoặc thế giới qua đôi mắt người nghệ sĩ. Khi những tác phẩm ấy được đặt cạnh nhau, chúng ta có thể khám phá vẻ đẹp trong nhiều chất liệu và hình thức, đồng thời nhận ra sự gắn kết giữa nghệ thuật với những trải nghiệm chung của con người.",

      "Khám phá bộ sưu tập là nhìn sâu hơn những điều hiện ra trước mắt. Một cử chỉ có thể biểu đạt cảm xúc; một hoa văn có thể lưu giữ truyền thống; một khung cảnh quen thuộc có thể mở ra góc nhìn mới về quá khứ. Tại Muses, khách tham quan được mời gọi theo đuổi sự tò mò, tìm hiểu các tác phẩm và khám phá cách những thế hệ nghệ sĩ khác nhau cảm nhận thế giới xung quanh. Mỗi cuộc gặp gỡ với nghệ thuật là một cơ hội suy ngẫm về những điều đã thay đổi, những giá trị còn tiếp nối và những cảm xúc vẫn chạm đến chúng ta.",

      "Thông qua website và ứng dụng di động Muses, hành trình này được mở rộng ra ngoài không gian bảo tàng. Người dùng có thể khám phá tác phẩm, tìm hiểu tác giả và tiếp cận thông tin bảo tàng bằng ngôn ngữ mình lựa chọn. Bằng cách đưa những câu chuyện nghệ thuật đến với nhiều đối tượng, Muses khuyến khích mỗi người quan sát kỹ hơn, đặt câu hỏi và tìm thấy sự kết nối riêng với nghệ thuật.",
    ],
  },

  zh: {
    home: "首页",
    collectionTitle: "馆藏",
    intro: [
      "在 Muses，艺术为我们打开一扇窗，让我们了解前人的生活、记忆与想象。一幅画、一尊木雕或一件陶器，都能讲述日常生活、爱与思念，以及艺术家眼中的世界。将这些作品汇聚在一起，我们不仅能发现不同材料与形式中的美，也能认识艺术表达与人类共同经历之间的联系。",

      "探索馆藏意味着超越表面，深入观察。一个姿态可以传达情感，一种纹样可以承载传统，一处熟悉的景象也可能带来认识过去的新视角。在 Muses，参观者可以跟随自己的好奇心，在作品之间探索，了解不同时代的艺术家如何诠释周围的世界。每一次与艺术的相遇，都让我们思考什么已经改变、什么得以延续，以及什么依然触动我们的心。",

      "通过 Muses 网站和移动应用，这段探索之旅可以延伸到博物馆之外。用户能够以自己选择的语言欣赏作品、了解创作者并探索博物馆信息。通过让不同背景的人都能接触这些故事，Muses 鼓励每个人仔细观察、提出问题，并与艺术建立属于自己的联系。",
    ],
  },

  ja: {
    home: "ホーム",
    collectionTitle: "コレクション",
    intro: [
      "Muses では、芸術を通して、先人たちの暮らしや記憶、想像の世界に触れることができます。一枚の絵画、木彫の像、陶器の器は、それぞれ日々の生活、愛や憧れ、そして芸術家の目に映った世界を物語ります。これらの作品を一緒に見ることで、さまざまな素材や表現に宿る美しさを発見し、芸術と私たちに共通する経験とのつながりを感じることができます。",

      "コレクションを探究することは、目に見えるものの奥に目を向けることです。ある仕草は感情を伝え、ある模様は伝統を受け継ぎ、見慣れた風景は過去への新しい視点を与えてくれます。Muses では、好奇心のままに作品を巡り、異なる世代の芸術家が世界をどのように捉えたのかを知ることができます。芸術との出会いは、変わったもの、受け継がれるもの、そして今も私たちの心を動かすものについて考える機会となります。",

      "Muses のウェブサイトとモバイルアプリを通じて、この旅は美術館の外へと広がります。ユーザーは選択した言語で作品を鑑賞し、作者について学び、美術館の情報を調べることができます。さまざまな背景を持つ人々に芸術の物語を届けることで、Muses は、じっくりと観察し、問いかけ、芸術との自分だけのつながりを見つけることを促します。",
    ],
  },

  ko: {
    home: "홈",
    collectionTitle: "소장품",
    intro: [
      "Muses에서 예술은 앞선 세대의 삶과 기억, 상상력을 들여다보는 창이 됩니다. 한 점의 그림, 목조 조각상, 도자기는 저마다 일상과 사랑, 그리움, 그리고 예술가의 눈에 비친 세상을 이야기합니다. 이러한 작품을 함께 살펴보면 다양한 재료와 형식에 담긴 아름다움을 발견하고, 예술적 표현과 우리가 공유하는 경험 사이의 연결을 이해할 수 있습니다.",

      "소장품을 탐구한다는 것은 눈에 보이는 것 너머를 바라보는 일입니다. 하나의 몸짓은 감정을 드러내고, 무늬는 전통을 담으며, 익숙한 풍경은 과거를 바라보는 새로운 시각을 선사할 수 있습니다. Muses에서는 호기심을 따라 작품을 살펴보고, 서로 다른 세대의 예술가들이 주변 세계를 어떻게 해석했는지 알아볼 수 있습니다. 예술과의 만남은 무엇이 변했고, 무엇이 이어지며, 무엇이 여전히 우리를 감동시키는지 돌아보는 기회가 됩니다.",

      "Muses 웹사이트와 모바일 앱을 통해 이 여정은 박물관 밖으로 이어집니다. 사용자는 원하는 언어로 작품을 탐색하고 작가를 알아보며 박물관 정보를 확인할 수 있습니다. 다양한 배경을 가진 사람들이 이러한 이야기를 접할 수 있도록 함으로써, Muses는 누구나 더 자세히 관찰하고 질문하며 예술과 자신만의 연결을 찾도록 돕습니다.",
    ],
  },
};