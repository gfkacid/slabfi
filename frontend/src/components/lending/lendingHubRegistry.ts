import type { ComponentType } from "react";
import { DepositLendingPanel } from "@/components/lending/panels/DepositLendingPanel";
import { BorrowLendingPanel } from "@/components/lending/panels/BorrowLendingPanel";
import { RepayLendingPanel } from "@/components/lending/panels/RepayLendingPanel";
import type { PillTabItem } from "@/components/tabs/PillTabs";

export type LendingTabId = "deposit" | "borrow" | "repay";

export const LENDING_HUB_TABS: readonly PillTabItem<LendingTabId>[] = [
  { id: "deposit", label: "Deposit" },
  { id: "borrow", label: "Borrow" },
  { id: "repay", label: "Repay" },
] as const;

const PANELS: Record<LendingTabId, ComponentType> = {
  deposit: DepositLendingPanel,
  borrow: BorrowLendingPanel,
  repay: RepayLendingPanel,
};

export function lendingHubPanelFor(tab: LendingTabId): ComponentType {
  return PANELS[tab];
}
