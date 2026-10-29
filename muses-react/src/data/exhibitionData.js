import hero from "../../background/muses4.jpg";
import ancientCapital from "../../tranh/HOANHACTRONGGIADINHOHUE.jpg";
import women from "../../tranh/THIEUNUBENHOAHUE.jpg";
import culture from "../../tranh/tranhsonmai/LEHOIDAUNAM.webp";
import nation from "../../tranh/tranhsonmai/THANHDONGTOQUOC.png";
import flowers from "../../background/muses9.jpg";
import painting from "../../background/muses8.jpg";
import students from "../../background/muses10.jpg";
import family from "../../background/muses2.jpg";

export const EXHIBITION_HERO = { img: hero, slot: "exhibition.hero" };

export const UPCOMING = {
  title: "MY BE LOVED ANCIENT CAPITAL",
  date: "4 November 2026 - 10 May 2027",
  img: ancientCapital,
  slot: "exhibition.upcoming",
  color: "#8a6a4a",
};

export const SPOTLIGHT = [
  {
    id: 1,
    title: "THE BEAUTY OF VIETNAMESE WOMAN",
    date: "1 Oct 2026 - 10 Jan 2027",
    img: women,
    slot: "exhibition.spotlight.1",
    color: "#b9b3c4",
  },
  {
    id: 2,
    title: "THE BEAUTY OF VIETNAMESES CULTURE",
    date: "17 Oct 2026 - 10 Feb 2027",
    img: culture,
    slot: "exhibition.spotlight.2",
    color: "#a8741f",
  },
  {
    id: 3,
    title: "HO CHI MINH PRESIDENT",
    date: "1 Oct 2026 - 10 Jan 2027",
    img: nation,
    slot: "exhibition.spotlight.3",
    color: "#d9a526",
  },
];

export const EVENTS = [
  {
    month: "OCTOBER 2026",
    items: [
      {
        id: 1,
        date: "1 October 2026 - 1 November 2026",
        startDate: "2026-10-01",
        endDate: "2026-11-01",
        tag: "WORKSHOP",
        title: "WORKSHOP MAKING FLOWER",
        note: "20/10 Woman Day",
        img: flowers,
        slot: "exhibition.event.1",
        color: "#c4552d",
      },
      {
        id: 2,
        date: "9 October 2026 - 9 November 2026",
        startDate: "2026-10-09",
        endDate: "2026-11-09",
        tag: "WORKSHOP",
        title: "WORKSHOP PAINTING CANVAS",
        note: "Try on now",
        img: painting,
        slot: "exhibition.event.2",
        color: "#b9b3c4",
      },
    ],
  },
];

export const TOURS = [
  {
    month: "OCTOBER 2026",
    items: [
      {
        id: 1,
        date: "MONDAY , TUESDAY, THURSDAY",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        weekdays: [1, 2, 4],
        tag: "GUIDE TOUR",
        audience: "Students",
        icon: "reading",
        title: "MUSES STUDENT",
        note: "Every Monday, Tuesday, Thurday",
        img: students,
        slot: "exhibition.tour.1",
        color: "#8a6a4a",
      },
      {
        id: 2,
        date: "FRIDAY, SATUREDAY, SUNDAY",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        weekdays: [5, 6, 0],
        tag: "WORKSHOP",
        age: "6+",
        audience: "Family",
        icon: "people",
        title: "MUSES FAMILY",
        note: "Every Friday, Satureday, Sunday",
        img: family,
        slot: "exhibition.tour.2",
        color: "#7a4a2a",
      },
    ],
  },
];
