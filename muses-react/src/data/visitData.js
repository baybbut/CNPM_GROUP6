/* Điền ảnh vào `img` (import từ folder tranh giống data.js). Để trống thì hiện ô màu. */
export const OPENING = {
  status: "The museum is open today from 9:00 AM to 9:00PM",
  rows: [
    { time: "9:00 AM – 9:00 PM", note: "Monday, Tuesday, Thursday, and Friday" },
    { time: "9:00 AM – 9:00 PM", note: "Saturday and Sunday" },
  ],
  closed: { label: "CLOSED", note: "Wednesday" },
};

export const TICKETS = [
  { title: "FOR VIETNAM'S ETHNIC MINORITIES", note: "For ethnic minorities of VietNam", price: "$0.96" },
  { title: "FOR STUDENTS AND VIETNAMESE UNDER 16 AGES", note: "See full list of visitors for free admission, and conditions", price: "FREE" },
  { title: "FOR VIETNAMESE AND FOREIGN VISITORS", note: "For Vietnamese, foreign visitors", price: "$1.92" },
];

export const DIRECTIONS = [
  { title: "WHICH ENTRANCE I SHOULD USE ?", link: "Find the right entrance", img: "" },
  { title: "GETTING HERE", link: "See more", img: "" },
  { title: "FINDING YOUR WAY AROUND THE MUSEUM", link: "Check your nearest way now", img: "" },
];

export const FACILITIES = [
  { label: "Information desks", icon: "info", color: "#14b8a6" },
  { label: "Loan for equipment", icon: "stroller", color: "#a855f7" },
  { label: "Cloakroom", icon: "hanger", color: "#e6c200" },
  { label: "Free Wifi", icon: "wifi", color: "#f97316" },
  { label: "Toilets", icon: "toilet", color: "#ec4899" },
  { label: "Car park", icon: "parking", color: "#2563eb" },
];

export const SERVICES = [
  { label: "AUDIO GUIDE", icon: "headphones", img: "" },
  { label: "GIFT SHOPS", icon: "gift", img: "" },
];

export const ACCESS = [
  { label: "Visitors with physical disabilities", icon: "wheelchair" },
  { label: "Visitors with hearing impairments", icon: "ear" },
  { label: "Visitors with visual impairments", icon: "eye" },
  { label: "Visitors with developmental and learning disabilities", icon: "bulb" },
];

export const FAQ = [
  { q: "Can I visit the museum for free ? Do I have to book the ticket ?", a: "Content will be updated." },
  { q: "Can I get refund ?", a: "Content will be updated." },
  { q: "Which entrance do I use if I have bought tickets online ?", a: "Content will be updated." },
];