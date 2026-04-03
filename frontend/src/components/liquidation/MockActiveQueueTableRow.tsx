import { Icon } from "@/components/ui/Icon";
import { useModal } from "@/components/modal";
import type { ActiveQueueMockRow } from "./activeLiquidationMock";
import { LIQUIDATION_BID_BUTTON_CLASS } from "./liquidationConstants";

type MockActiveQueueTableRowProps = {
  row: ActiveQueueMockRow;
};

export function MockActiveQueueTableRow({ row }: MockActiveQueueTableRowProps) {
  const { openModal } = useModal();
  return (
    <tr className="transition-colors hover:bg-surface-container-high">
      <td className="px-6 py-6 md:px-8">
        <div className="flex items-center gap-4">
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-outline-variant/20">
            <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-headline truncate font-bold text-primary">{row.assetName}</p>
            <p className="font-mono text-xs text-on-surface-variant">{row.vaultLabel}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <span className="font-bold text-primary">{row.debtUsdc}</span>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full bg-error ${row.healthPulse ? "animate-pulse" : ""}`}
            aria-hidden
          />
          <span className="font-bold text-error">{row.healthFactor}</span>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-on-surface">
          <Icon name="schedule" className="text-sm" />
          <span className="tabular-nums">{row.timeLabel}</span>
        </div>
      </td>
      <td className="px-6 py-6">
        <span className="font-bold text-primary">{row.bidUsdc}</span>
      </td>
      <td className="px-6 py-6 text-right md:px-8">
        <button
          type="button"
          onClick={() => openModal("bid", { variant: "mock", row })}
          className={LIQUIDATION_BID_BUTTON_CLASS}
        >
          Bid
        </button>
      </td>
    </tr>
  );
}
