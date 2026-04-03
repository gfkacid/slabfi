import {
  COLLATERAL_STATUS_LABELS,
  COLLATERAL_STATUS_BADGE_CLASSES,
} from "@slabfinance/shared";

interface StatusBadgeProps {
  status: number;
  type?: "collateral" | "position";
}

export function StatusBadge({ status, type = "collateral" }: StatusBadgeProps) {
  void type;
  const label = COLLATERAL_STATUS_LABELS[status] ?? "Unknown";
  const className =
    COLLATERAL_STATUS_BADGE_CLASSES[status] ?? "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
      title={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
