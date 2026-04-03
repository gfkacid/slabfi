import type { ReactNode } from "react";

type LiquidationTableSectionProps = {
  children: ReactNode;
};

export function LiquidationTableSection({ children }: LiquidationTableSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-low">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
