export const LIQUIDATION_QUEUE_TABS = [
  { id: "active" as const, label: "Active Queue" },
  { id: "history" as const, label: "History" },
] as const;

export type LiquidationTabId = (typeof LIQUIDATION_QUEUE_TABS)[number]["id"];
