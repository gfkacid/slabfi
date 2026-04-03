import { Link } from "react-router-dom";
import { usePositionStatus } from "@/hooks/useHealthFactor";

export function LiquidationWarningBanner() {
  const { data: status } = usePositionStatus();

  // 1 = WARNING, 2 = LIQUIDATABLE
  if (status === undefined || (Number(status) !== 1 && Number(status) !== 2)) {
    return null;
  }

  const isLiquidatable = Number(status) === 2;

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        isLiquidatable
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">
          {isLiquidatable
            ? "Your position is liquidatable. Repay debt or add collateral within 6 hours to avoid liquidation."
            : "Your health factor is in the warning zone. Consider repaying or adding collateral."}
        </p>
        <Link
          to="/repay"
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          Repay
        </Link>
      </div>
    </div>
  );
}
