import React from "react";
const paths = {
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  home: "m3 10 9-7 9 7v11h-6v-7H9v7H3z",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4",
  chart: "M4 21V11h4v10 M10 21V3h4v18 M16 21V7h4v14",
  image: "M3 3h18v18H3z M3 16l6-6 12 11 M15 7h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M3 22a9 9 0 0 1 18 0",
  audio: "M3 14v-3a9 9 0 0 1 18 0v3 M3 12h4v9H3z M17 12h4v9h-4z",
  calendar: "M3 5h18v16H3z M7 2v6 M17 2v6 M3 11h18",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  qr: "M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h2v2h-2z M21 15v6h-6",
  map: "m3 6 6-3 6 3 6-3v16l-6 3-6-3-6 3z M9 3v16 M15 6v16",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 2-1 4-4 3-3-2-4-1-3-4 2-3 1-4z",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M9 21h6",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  plus: "M12 4v16 M4 12h16",
  logout: "M9 3H3v18h6 M9 12h13 M17 7l5 5-5 5",
  upload:
    "M7 18H5a4 4 0 0 1-1-8 8 8 0 0 1 15-2 5 5 0 0 1 0 10h-2 M12 21V10 M8 14l4-4 4 4",
  list: "M8 5h13 M8 12h13 M8 19h13 M3 5h.01 M3 12h.01 M3 19h.01",
  museum:
    "m2 8 10-6 10 6z M2 22h20 M4 19h16 M6 10v7 M10 10v7 M14 10v7 M18 10v7",
  close: "m6 6 12 12 M6 18 18 6",
};
export default function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.list} />
    </svg>
  );
}
