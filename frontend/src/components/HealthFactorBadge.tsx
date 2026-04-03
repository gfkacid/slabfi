import {
  POSITION_STATUS_LABELS,
  POSITION_STATUS_BADGE_CLASSES,
} from "@slabfinance/shared";
import { usePositionStatus } from "@/hooks/useHealthFactor";

export function HealthFactorBadge() {
  const { data: status, isLoading, isError } = usePositionStatus();

  if (isLoading || isError || status === undefined) {
    return (
      <span className="rounded-full border px-3 py-1 text-sm font-medium bg-slate-100 text-slate-500 border-slate-200">
        —
      </span>
    );
  }

  const n = Number(status);
  const label = POSITION_STATUS_LABELS[n] ?? "Unknown";
  const colorClass =
    POSITION_STATUS_BADGE_CLASSES[n] ?? "bg-slate-100 text-slate-600";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm font-medium ${colorClass}`}
      title={`Health factor status: ${label}`}
    >
      {label}
    </span>
  );
}
