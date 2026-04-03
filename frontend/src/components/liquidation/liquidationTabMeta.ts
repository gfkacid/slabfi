import type { LiquidationTabId } from "./liquidationTypes";

export type LiquidationStatItem = {
  label: string;
  value: string;
  hint?: string;
  hintClassName?: string;
};

export type LiquidationPromoConfig = {
  title: string;
  description: string;
  ctaLabel: string;
  icon: "terminal" | "history_edu";
};

export type LiquidationTabMeta = {
  title: string;
  subtitle: string;
  stats: readonly LiquidationStatItem[];
  promo: LiquidationPromoConfig;
};

export const liquidationTabMeta: Record<LiquidationTabId, LiquidationTabMeta> = {
  active: {
    title: "Liquidation Queue",
    subtitle: "Participate in collateralized asset recovery auctions.",
    stats: [
      {
        label: "Total Repaid (24h)",
        value: "$4,829,102",
        hint: "+12.4%",
        hintClassName: "text-sm font-bold text-on-tertiary-container",
      },
      {
        label: "Active Liquidators",
        value: "1,204",
        hint: "Wallets",
        hintClassName: "text-sm font-medium text-on-surface-variant",
      },
    ],
    promo: {
      title: "Automated Liquidator API",
      description:
        "Power your bots with our low-latency liquidation streams. Earn up to 8.5% in penalty fees by being the first to bid on distressed collateral.",
      ctaLabel: "Documentation",
      icon: "terminal",
    },
  },
  history: {
    title: "Past Liquidations",
    subtitle: "Historical record of all successfully closed liquidation auctions.",
    stats: [
      { label: "Total Liquidated (Lifetime)", value: "$82,492,102" },
      {
        label: "Resolved Auctions",
        value: "14,204",
        hint: "Closed",
        hintClassName: "text-sm font-medium text-on-surface-variant",
      },
    ],
    promo: {
      title: "Governance Participation",
      description:
        "Historical liquidation data is used by the DAO to adjust collateral factors and penalty fees. Have your say in the next parameter update.",
      ctaLabel: "Go to Governance",
      icon: "history_edu",
    },
  },
};
