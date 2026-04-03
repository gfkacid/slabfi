import { Icon } from "@/components/ui/Icon";
import { HISTORY_LIQUIDATION_ROWS } from "./historyLiquidationMock";
import { LiquidationTableSection } from "./LiquidationTableSection";

const theadClass =
  "border-b border-outline-variant/10 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-on-primary-container";

export function HistoryLiquidationsTable() {
  return (
    <LiquidationTableSection>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className={theadClass}>
            <th className="px-6 py-5 md:px-8">Status</th>
            <th className="px-6 py-5">Liquidated Asset</th>
            <th className="px-6 py-5">Winning Bid</th>
            <th className="px-6 py-5">Date</th>
            <th className="px-6 py-5 text-right md:px-8">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/5">
          {HISTORY_LIQUIDATION_ROWS.map((row) => (
            <tr
              key={`${row.assetName}-${row.closingDate}`}
              className="transition-colors hover:bg-surface-container-high"
            >
              <td className="px-6 py-6 md:px-8">
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-lg text-tertiary-fixed-dim" />
                  <span className="text-sm font-bold text-on-tertiary-container">Success</span>
                </div>
              </td>
              <td className="px-6 py-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-outline-variant/10">
                    <img
                      src={row.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{row.assetName}</p>
                    <p className="text-xs text-on-surface-variant">{row.assetSubtitle}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-6">
                <span className="text-sm font-bold text-primary">{row.winningBidUsdc}</span>
              </td>
              <td className="px-6 py-6 text-sm font-medium text-on-surface-variant">
                {row.closingDate}
              </td>
              <td className="px-6 py-6 text-right md:px-8">
                <a
                  href={row.explorerHref}
                  className="inline-flex items-center gap-1 text-sm font-bold text-secondary hover:underline"
                >
                  View on Scan
                  <Icon name="open_in_new" className="text-sm" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </LiquidationTableSection>
  );
}
