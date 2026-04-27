import type { BootstrapIconName } from "@/components/ui/BootstrapIcon";

export const COLLECTIBLES_CARD_IMAGES = [
  "https://www.figma.com/api/mcp/asset/0ace6870-83ce-4bad-bb93-e817ddec676b",
  "https://www.figma.com/api/mcp/asset/d05c35a1-112a-4544-9bdd-ffa7548b6ed3",
  "https://www.figma.com/api/mcp/asset/61eb7b45-9799-488d-b4f8-3489cfbc1c1d",
  "https://www.figma.com/api/mcp/asset/32479b42-099c-4cd4-8e6d-489d95bef36a",
  "https://www.figma.com/api/mcp/asset/9323383b-a4f1-457a-9969-2cb8559e92e9",
  "https://www.figma.com/api/mcp/asset/fcd40788-224a-4ad9-8f2f-b43f337fb256",
  "https://www.figma.com/api/mcp/asset/e55a80c0-c9c4-41c2-a81f-11441f88a6c6",
  "https://www.figma.com/api/mcp/asset/dd8b9092-047a-4ec0-9f56-995877590cff",
] as const;

export type CollectibleCardData = {
  name: string;
  grade: string;
  tierIcon: BootstrapIconName;
  collectionIconSrc: string;
  imageSrc: string;
  overlays?: Array<
    | { kind: "pill"; icon: BootstrapIconName; className: string }
    | { kind: "pill-svg"; url: string; className: string }
  >;
  value: string;
};

export type CollectibleStatus = "Healthy" | "Warning" | "Auction";

export type CollectibleListRow = {
  name: string;
  grade: string;
  collectionLabel: string;
  collectionIconSrc: string;
  imageSrc: string;
  value: string;
  status: CollectibleStatus;
  hf: string;
  action?: { label: string; tone: "neutral" | "brand" };
};

export type TierRow = {
  label: string;
  count: string;
  value: string;
  ltv: string;
  icon: BootstrapIconName;
};

