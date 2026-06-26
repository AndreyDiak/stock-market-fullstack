import {
  BankIcon,
  CharacterIcon,
  ExchangeIcon,
  NewsIcon,
  OtcDealsIcon,
  RealEstateIcon,
} from "../../../shared/icons";
import type { sidebar_nav_item } from "./types";

const NAV_ICON_CLASS = "h-7 w-7";

export const SIDEBAR_PRIMARY_ITEMS: sidebar_nav_item[] = [
  {
    id: "character",
    label: "Персонаж",
    shortLabel: "Персонаж",
    icon: <CharacterIcon className={NAV_ICON_CLASS} />,
  },
  {
    id: "bank",
    label: "Банк",
    shortLabel: "Банк",
    icon: <BankIcon className={NAV_ICON_CLASS} />,
  },
];

export const NAV_ITEMS: sidebar_nav_item[] = [
  {
    id: "exchange",
    label: "Биржа",
    shortLabel: "Биржа",
    icon: <ExchangeIcon className={NAV_ICON_CLASS} />,
  },
  {
    id: "news",
    label: "Новости",
    shortLabel: "Новости",
    icon: <NewsIcon className={NAV_ICON_CLASS} />,
  },
  {
    id: "otc",
    label: "Сделки",
    shortLabel: "Сделки",
    icon: <OtcDealsIcon className={NAV_ICON_CLASS} />,
  },
  {
    id: "real-estate",
    label: "Рынок",
    shortLabel: "Рынок",
    icon: <RealEstateIcon className={NAV_ICON_CLASS} />,
  },
];
