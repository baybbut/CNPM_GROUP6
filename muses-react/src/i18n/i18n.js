/* Thêm ngôn ngữ mới: thêm 1 mục vào LANGUAGES và 1 khối dịch trong TRANSLATIONS */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية", rtl: true },
  { code: "th", label: "ไทย" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "hi", label: "हिन्दी" },
];

const k = (a) => Object.fromEntries(
  ["visit","exhibition","explore","search","ticket","welcome","openToday","hours","bookTicket","prepare",
   "highlight","news","newsText","welcomeTitle","exploreBtn","prepareDesc","about","contact","follow",
   "rules","exhibitionLink","goods"].map((key, i) => [key, a[i]])
);

export const TRANSLATIONS = {
  en: k(["Visit","Exhibition and Events","Explore","Search","Ticket","Welcome to Muses","The Museum is open today","9:00AM - 9:00PM","Book a ticket","Prepare your visit","HIGHLIGHT","MUSES’S NEWS","This for news","WELCOME TO MUSES","EXPLORE","Everything you need to know before visiting the museum","ABOUT","CONTACT","FOLLOW","Rules","Exhibition","Goods"]),
  vi: k(["Tham quan","Triển lãm và Sự kiện","Khám phá","Tìm kiếm","Vé","Chào mừng đến với Muses","Bảo tàng mở cửa hôm nay","9:00 - 21:00","Đặt vé","Chuẩn bị chuyến thăm","NỔI BẬT","TIN TỨC MUSES","Nội dung tin tức","CHÀO MỪNG ĐẾN VỚI MUSES","KHÁM PHÁ","Mọi điều bạn cần biết trước khi đến bảo tàng","GIỚI THIỆU","LIÊN HỆ","THEO DÕI","Quy định","Triển lãm","Quà lưu niệm"]),
  fr: k(["Visite","Expositions et événements","Explorer","Rechercher","Billet","Bienvenue au Muses","Le musée est ouvert aujourd’hui","9h00 - 21h00","Réserver un billet","Préparer votre visite","À LA UNE","ACTUALITÉS DU MUSES","Ici, les actualités","BIENVENUE AU MUSES","EXPLORER","Tout ce qu’il faut savoir avant de visiter le musée","À PROPOS","CONTACT","SUIVRE","Règlement","Exposition","Boutique"]),
  es: k(["Visita","Exposiciones y eventos","Explorar","Buscar","Entrada","Bienvenido a Muses","El museo está abierto hoy","9:00 - 21:00","Reservar entrada","Prepara tu visita","DESTACADOS","NOTICIAS DE MUSES","Aquí van las noticias","BIENVENIDO A MUSES","EXPLORAR","Todo lo que necesitas saber antes de visitar el museo","ACERCA DE","CONTACTO","SÍGUENOS","Normas","Exposición","Tienda"]),
  de: k(["Besuch","Ausstellungen und Veranstaltungen","Entdecken","Suchen","Ticket","Willkommen im Muses","Das Museum ist heute geöffnet","9:00 - 21:00 Uhr","Ticket buchen","Besuch vorbereiten","HIGHLIGHTS","MUSES NEWS","Hier stehen die Neuigkeiten","WILLKOMMEN IM MUSES","ENTDECKEN","Alles Wissenswerte vor Ihrem Museumsbesuch","ÜBER UNS","KONTAKT","FOLGEN","Hausordnung","Ausstellung","Shop"]),
  it: k(["Visita","Mostre ed eventi","Esplora","Cerca","Biglietto","Benvenuti al Muses","Il museo è aperto oggi","9:00 - 21:00","Prenota un biglietto","Prepara la tua visita","IN EVIDENZA","NOTIZIE DI MUSES","Qui le notizie","BENVENUTI AL MUSES","ESPLORA","Tutto ciò che devi sapere prima di visitare il museo","CHI SIAMO","CONTATTI","SEGUICI","Regole","Mostra","Negozio"]),
  pt: k(["Visita","Exposições e eventos","Explorar","Pesquisar","Bilhete","Bem-vindo ao Muses","O museu está aberto hoje","9:00 - 21:00","Reservar bilhete","Prepare a sua visita","DESTAQUES","NOTÍCIAS DO MUSES","Aqui ficam as notícias","BEM-VINDO AO MUSES","EXPLORAR","Tudo o que precisa de saber antes de visitar o museu","SOBRE","CONTACTO","SIGA-NOS","Regras","Exposição","Loja"]),
  ru: k(["Посещение","Выставки и события","Исследовать","Поиск","Билет","Добро пожаловать в Muses","Сегодня музей открыт","9:00 - 21:00","Купить билет","Подготовьтесь к визиту","ГЛАВНОЕ","НОВОСТИ MUSES","Здесь будут новости","ДОБРО ПОЖАЛОВАТЬ В MUSES","ИССЛЕДОВАТЬ","Всё, что нужно знать перед посещением музея","О НАС","КОНТАКТЫ","МЫ В СЕТИ","Правила","Выставка","Сувениры"]),
  ja: k(["ご来館","展覧会・イベント","探索する","検索","チケット","Musesへようこそ","本日開館しています","9:00 - 21:00","チケットを予約","ご来館の準備","ハイライト","MUSESニュース","ニュースはこちら","MUSESへようこそ","探索する","ご来館前に知っておきたいすべて","概要","お問い合わせ","フォロー","ルール","展覧会","グッズ"]),
  ko: k(["방문","전시 및 행사","탐색","검색","티켓","Muses에 오신 것을 환영합니다","오늘 박물관 운영 중","오전 9:00 - 오후 9:00","티켓 예매","방문 준비","하이라이트","MUSES 소식","뉴스 내용","MUSES에 오신 것을 환영합니다","탐색","박물관 방문 전 알아두실 모든 것","소개","문의","팔로우","이용 규칙","전시","굿즈"]),
  zh: k(["参观","展览与活动","探索","搜索","门票","欢迎来到 Muses","博物馆今日开放","9:00 - 21:00","预订门票","筹备您的参观","精选","MUSES 新闻","新闻内容","欢迎来到 MUSES","探索","参观博物馆前您需要了解的一切","关于","联系","关注","参观规则","展览","文创商品"]),
  ar: k(["الزيارة","المعارض والفعاليات","استكشف","بحث","تذكرة","مرحبًا بكم في Muses","المتحف مفتوح اليوم","9:00 ص - 9:00 م","احجز تذكرة","خطط لزيارتك","أبرز المعروضات","أخبار MUSES","هنا الأخبار","مرحبًا بكم في MUSES","استكشف","كل ما تحتاج إلى معرفته قبل زيارة المتحف","حول","اتصل بنا","تابعنا","القواعد","المعرض","المنتجات"]),
  th: k(["เยี่ยมชม","นิทรรศการและกิจกรรม","สำรวจ","ค้นหา","บัตร","ยินดีต้อนรับสู่ Muses","วันนี้พิพิธภัณฑ์เปิดให้บริการ","9:00 - 21:00 น.","จองบัตร","เตรียมตัวเยี่ยมชม","ไฮไลต์","ข่าวสาร MUSES","ข่าวอยู่ตรงนี้","ยินดีต้อนรับสู่ MUSES","สำรวจ","ทุกสิ่งที่ควรรู้ก่อนเยี่ยมชมพิพิธภัณฑ์","เกี่ยวกับ","ติดต่อ","ติดตาม","กฎระเบียบ","นิทรรศการ","สินค้าที่ระลึก"]),
  id: k(["Kunjungan","Pameran dan Acara","Jelajahi","Cari","Tiket","Selamat datang di Muses","Museum buka hari ini","09.00 - 21.00","Pesan tiket","Siapkan kunjungan Anda","SOROTAN","BERITA MUSES","Berita ada di sini","SELAMAT DATANG DI MUSES","JELAJAHI","Semua yang perlu Anda ketahui sebelum mengunjungi museum","TENTANG","KONTAK","IKUTI","Peraturan","Pameran","Suvenir"]),
  hi: k(["भ्रमण","प्रदर्शनियाँ और कार्यक्रम","खोजें","खोज","टिकट","Muses में आपका स्वागत है","संग्रहालय आज खुला है","सुबह 9:00 - रात 9:00","टिकट बुक करें","अपनी यात्रा की तैयारी करें","मुख्य आकर्षण","MUSES समाचार","समाचार यहाँ","MUSES में आपका स्वागत है","खोजें","संग्रहालय आने से पहले आपको जो कुछ जानना है","हमारे बारे में","संपर्क","फ़ॉलो करें","नियम","प्रदर्शनी","सामान"]),
};
