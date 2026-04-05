import {
  POSITION_STATUS_LABELS,
  POSITION_STATUS_BADGE_CLASSES,
} from "@slabfinance/shared";
import { useHealthFactorWad, usePositionStatus, useUserPosition } from "@/hooks";
import { formatDisplayHealthFactor } from "@/lib/hubFormat";

export function HealthFactorBadge() {
  const { data: status, isLoading: statusLoading, isError: statusError } = usePositionStatus();
  const liveHf = useHealthFactorWad();
  const position = useUserPosition();
  const indexedWad = position.data?.indexedPosition?.healthFactorWad ?? null;

  const hfText = formatDisplayHealthFactor(liveHf.data, Boolean(liveHf.isError), indexedWad);
  const loading = statusLoading || liveHf.isLoading || position.isLoading;

  if (loading) {
    return (
      <span className="rounded-full border px-3 py-1 text-sm font-medium bg-slate-100 text-slate-500 border-slate-200">
        …
      </span>
    );
  }

  if (statusError || status === undefined) {
    return (
      <span className="rounded-full border px-3 py-1 text-sm font-medium bg-slate-100 text-slate-500 border-slate-200">
        {hfText}
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
      title={`${label} · health factor ${hfText}`}
    >
      {hfText}
    </span>
  );
}
