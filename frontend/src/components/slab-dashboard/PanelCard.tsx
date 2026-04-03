import type { HTMLAttributes } from "react";
import { dashboardSurface } from "@/components/slab-dashboard/dashboardTokens";

type PanelCardVariant = "panel" | "panelTight";

type PanelCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: PanelCardVariant;
};

const variantClass: Record<PanelCardVariant, string> = {
  panel: dashboardSurface.panel,
  panelTight: dashboardSurface.panelTight,
};

export function PanelCard({
  variant = "panel",
  className = "",
  children,
  ...rest
}: PanelCardProps) {
  return (
    <div className={`${variantClass[variant]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
