import type { ReactNode } from "react";
import { lendingGhostBorder } from "@/components/shared/lending/lendingStyles";

type LendingActionPanelProps = {
  id: string;
  labelledBy?: string;
  children: ReactNode;
};

export function LendingActionPanel({ id, labelledBy, children }: LendingActionPanelProps) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      className={`rounded-xl bg-white p-8 shadow-sm ${lendingGhostBorder}`.trim()}
    >
      {children}
    </div>
  );
}
