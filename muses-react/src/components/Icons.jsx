import infoImage from "../../icon/info.png";
export const TicketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H3z" />
  </svg>
);
export const InfoIcon = () => (
  <img
    src={infoImage}
    alt=""
    width={20}
    height={20}
    style={{ objectFit: "contain" }}
  />
);
