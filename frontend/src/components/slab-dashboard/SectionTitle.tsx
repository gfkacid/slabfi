import type { HTMLAttributes, ReactNode } from "react";
import { dashboardType } from "@/components/slab-dashboard/dashboardTokens";

type SectionTitleProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  action?: ReactNode;
};

export function SectionTitle({
  title,
  action,
  className = "",
  ...rest
}: SectionTitleProps) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`.trim()} {...rest}>
      <h2 className={dashboardType.sectionTitle}>{title}</h2>
      {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
    </div>
  );
}
