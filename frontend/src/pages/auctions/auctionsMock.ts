import type { BootstrapIconName } from "@/components/ui/BootstrapIcon";
import { COLLECTIBLES_CARD_IMAGES } from "@/pages/collectibles/collectiblesMock";

import beezieIcon from "@/assets/pngs/beezie.png";
import collectorCryptIcon from "@/assets/pngs/collector_crypt.png";
import courtyardIcon from "@/assets/pngs/courtyard.png";

export type AuctionStatus = "Live" | "Ending Soon" | "Sold";

export type AuctionCardData = {
  id: string;
  name: string;
  grade: string;
  tierIcon: BootstrapIconName;
  collectionIconSrc: string;
  collectionLabel: string;
  imageSrc: string;
  value: string;
  discountLabel: string;
  highestBid: string;
  bidsCount: number;
  seller: string;
  endsInLabel: string;
  countdownParts: readonly [string, string, string, string, string];
  status: AuctionStatus;
};

export const AUCTION_CARDS: AuctionCardData[] = [
  {
    id: "auc-1001",
    name: "Mega Kangaskhan ex (MEG 104)",
    grade: "PSA 9",
    tierIcon: "trophy",
    collectionIconSrc: collectorCryptIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[0],
    value: "$2,345.67",
    discountLabel: "-23%",
    highestBid: "$2,345.67",
    bidsCount: 12,
    seller: "0x4ac…921a",
    endsInLabel: "59m",
    countdownParts: ["02", "/", "04", ":", "33"],
    status: "Ending Soon",
  },
  {
    id: "auc-1002",
    name: "Victini (SVP 208)",
    grade: "BGS 9.5",
    tierIcon: "award",
    collectionIconSrc: courtyardIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[1],
    value: "$901.23",
    discountLabel: "-28%",
    highestBid: "$901.23",
    bidsCount: 7,
    seller: "0x3b1…c8f4",
    endsInLabel: "5h 59m",
    countdownParts: ["02", "/", "04", ":", "33"],
    status: "Live",
  },
  {
    id: "auc-1003",
    name: "Jellicent ex (WHT 045)",
    grade: "CGC 9.5",
    tierIcon: "x-diamond",
    collectionIconSrc: beezieIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[2],
    value: "$456.78",
    discountLabel: "-26%",
    highestBid: "$456.78",
    bidsCount: 3,
    seller: "0xb22…7f11",
    endsInLabel: "11h 59m",
    countdownParts: ["02", "/", "04", ":", "33"],
    status: "Live",
  },
  {
    id: "auc-1004",
    name: "Pawmi (PAF 226)",
    grade: "SGC 10",
    tierIcon: "graph-up-arrow",
    collectionIconSrc: courtyardIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[3],
    value: "$678.90",
    discountLabel: "-26%",
    highestBid: "$678.90",
    bidsCount: 9,
    seller: "0xd09…3caa",
    endsInLabel: "17h 59m",
    countdownParts: ["02", "/", "04", ":", "33"],
    status: "Ending Soon",
  },
  {
    id: "auc-1005",
    name: "Psyduck (MEP 007)",
    grade: "PSA 9",
    tierIcon: "award",
    collectionIconSrc: courtyardIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[4],
    value: "$345.67",
    discountLabel: "-21%",
    highestBid: "$345.67",
    bidsCount: 0,
    seller: "0x91d…0a2e",
    endsInLabel: "—",
    countdownParts: ["—", "—", "—", "—", "—"],
    status: "Sold",
  },
  {
    id: "auc-1006",
    name: "Meloetta ex (MEL 200)",
    grade: "CGC 9",
    tierIcon: "trophy",
    collectionIconSrc: beezieIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[5],
    value: "$789.01",
    discountLabel: "-18%",
    highestBid: "$789.01",
    bidsCount: 21,
    seller: "0x7fe…11bd",
    endsInLabel: "6h 05m",
    countdownParts: ["02", "/", "04", ":", "33"],
    status: "Live",
  },
  {
    id: "auc-1007",
    name: "Pikachu (PRM 001)",
    grade: "BGS 9.5",
    tierIcon: "trophy",
    collectionIconSrc: collectorCryptIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[6],
    value: "$1,230.00",
    discountLabel: "-12%",
    highestBid: "$1,230.00",
    bidsCount: 34,
    seller: "0x1c0…9aa0",
    endsInLabel: "12h 09m",
    countdownParts: ["02", "/", "04", ":", "33"],
    status: "Live",
  },
  {
    id: "auc-1008",
    name: "Charizard (ZRD 099)",
    grade: "PSA 10",
    tierIcon: "trophy",
    collectionIconSrc: courtyardIcon,
    collectionLabel: "Grail",
    imageSrc: COLLECTIBLES_CARD_IMAGES[7],
    value: "$2,420.00",
    discountLabel: "-31%",
    highestBid: "$2,420.00",
    bidsCount: 58,
    seller: "0xfa1…beef",
    endsInLabel: "9m",
    countdownParts: ["02", "/", "04", ":", "33"],
    status: "Ending Soon",
  },
];

export const FEATURED_AUCTIONS: AuctionCardData[] = [AUCTION_CARDS[7], AUCTION_CARDS[0], AUCTION_CARDS[6]];

