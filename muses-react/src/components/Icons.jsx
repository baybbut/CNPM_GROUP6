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
import eye from "../../icon/eye.png";
import twoFace from "../../icon/two.png";
import babyImage from "../../icon/baby.png";
import searchImageWhite from "../../icon/searchW.png";
import searchImageBlack from  "../../icon/search.png";


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

  export const SearchIcon = ({ light = false }) => (
  <img
    src={light ? searchImageWhite : searchImageBlack}
    alt=""
    className="search-icon"
  />
);


const ICON_IMAGES = { // gọi hình
  info: infoSignImage,
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
  eye: eye,
  stroller: babyImage,
  bulb: twoFace,
};

export const SvgIcon = ({ kind, size = 24 }) => {
  const image = ICON_IMAGES[kind];


  if (!image) {
  console.warn("Chưa có ảnh cho icon:", kind);
  return null;
}

  return (
    <img
      src={image}
      alt=""
      width={size}
      height={size}
      style={{
        display: "block",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
};