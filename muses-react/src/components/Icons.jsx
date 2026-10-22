import infoImage from "../../icon/info.png";
import infoSignImage from "../../icon/info-sign.png";
import wifiImage from "../../icon/wifi.png";
import cloakRoomImage from "../../icon/room.png";
import wheelchairImage from "../../icon/wheelchair.png";
import parkingImage from "../../icon/parking.png";
import earImage from "../../icon/ear.png";
import toiletImage from "../../icon/toilet.png";
import earPhoneImage from "../../icon/earphones.png";
import giftImage from "../../icon/gift.png";
import eyeImage from "../../icon/eye.png";
import twoFace from "../../icon/two.png";
import babyImage from "../../icon/baby.png";
import searchWhite from "../../icon/searchW.png";
import searchBlack from "../../icon/search.png";
import ticketWhite from "../../icon/ticketW.png";
import ticketBlack from "../../icon/ticketB.png";
import calendar from "../../icon/date-calendar.png";
import calendarBlack from "../../icon/date-calendar-mobile.png";
import logo from "../../icon/logo.png";
import logoWhite from "../../icon/logow.png";
import down from "../../icon/down.png";
import home from "../../icon/home.png";
import homeWhite from "../../icon/homeW.png";
import photo from "../../icon/photoB.png";
import photoWhite from "../../icon/photoW.png";
import explore from "../../icon/exploreB.png";
import exploreWhite from "../../icon/exploreW.png";
import pin from "../../icon/pinB.png";
import pinWhite from "../../icon/pinW.png";
import facebook from "../../icon/social (1).png";
import instagram from "../../icon/instagram.png";
import twitter from "../../icon/twitter.png";
import people from "../../icon/people.png";
import reading from "../../icon/reading.png";
import menu from "../../icon/menuB.png";
import menuWhite from "../../icon/menuW.png";

const icons = {
  info: infoSignImage,
  information: infoImage,
  wifi: wifiImage,
  hanger: cloakRoomImage,
  cloakroom: cloakRoomImage,
  headphones: earPhoneImage,
  earphone: earPhoneImage,
  wheelchair: wheelchairImage,
  parking: parkingImage,
  ear: earImage,
  toilet: toiletImage,
  gift: giftImage,
  eye: eyeImage,
  stroller: babyImage,
  bulb: twoFace,
  search: searchBlack,
  ticket: ticketBlack,
  calendar: calendarBlack,
  leaf: logo,
  logo,
  chevron: down,
  chevronRight: down,
  home,
  photo,
  explore,
  pin,
  facebook,
  instagram,
  twitter,
  people,
  reading,
  menu,
};
const whiteIcons = {
  search: searchWhite,
  ticket: ticketWhite,
  calendar,
  leaf: logoWhite,
  logo: logoWhite,
  home: homeWhite,
  photo: photoWhite,
  explore: exploreWhite,
  pin: pinWhite,
  menu: menuWhite,
};

export function SvgIcon({
  kind,
  size = 24,
  light = false,
  className = "",
  style,
  direction,
}) {
  if (kind === "qr")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h4v4h-7zM21 13v2M13 21v-3" />
        <path d="M6 6h1v1H6zM17 6h1v1h-1zM6 17h1v1H6z" />
      </svg>
    );
  // No arrow file exists in icon/: retain a simple directional vector.
  if (kind === "arrow")
    return (
      <svg
        className={`asset-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
        style={{
          transform:
            direction === "left"
              ? "rotate(180deg)"
              : direction === "up"
                ? "rotate(-90deg)"
                : undefined,
          ...style,
        }}
      >
        <path d="M3 12h18m-6-5 6 5-6 5" />
      </svg>
    );
  const image = (light && whiteIcons[kind]) || icons[kind];
  if (!image) return null;
  return (
    <img
      className={`asset-icon ${className}`}
      src={image}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{
        display: "inline-block",
        objectFit: "contain",
        flexShrink: 0,
        verticalAlign: "middle",
        transform: kind === "chevronRight" ? "rotate(-90deg)" : undefined,
        ...style,
      }}
    />
  );
}
export const TicketIcon = ({ light = true, ...props }) => (
  <SvgIcon kind="ticket" size={20} light={light} {...props} />
);
export const InfoIcon = (props) => (
  <SvgIcon kind="information" size={20} {...props} />
);
export const SearchIcon = ({ light = false, ...props }) => (
  <SvgIcon
    kind="search"
    size={20}
    light={light}
    className="search-icon"
    {...props}
  />
);
