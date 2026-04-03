import type { ReactNode } from "react";
import { ActiveQueueTableRow, type AuctionRow } from "./ActiveQueueTableRow";
import { MockActiveQueueTableRow } from "./MockActiveQueueTableRow";
import { ACTIVE_QUEUE_MOCK_ROWS } from "./activeLiquidationMock";
import { LiquidationTableSection } from "./LiquidationTableSection";

const theadClass =
  "border-b border-outline-variant/10 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-on-primary-container";

type ActiveLiquidationsTableProps = {
  entries: readonly AuctionRow[];
  isLoading: boolean;
  onPlaceBid: (entry: AuctionRow, amountWei: bigint) => Promise<void>;
  onClaim: (entry: AuctionRow) => Promise<void>;
  emptyMessage?: string;
  gate?: ReactNode;
  /** When true (e.g. hub connected, queue empty), show Stitch-style example rows. */
  showMockRows?: boolean;
};

export function ActiveLiquidationsTable({
  entries,
  isLoading,
  onPlaceBid,
  onClaim,
  emptyMessage = "No active liquidations.",
  gate,
  showMockRows = false,
}: ActiveLiquidationsTableProps) {
  const colSpan = 6;

  return (
    <LiquidationTableSection>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className={theadClass}>
            <th className="px-6 py-5 md:px-8">Asset</th>
            <th className="px-6 py-5">Current Debt</th>
            <th className="px-6 py-5">Health Factor</th>
            <th className="px-6 py-5">Time Remaining</th>
            <th className="px-6 py-5">Current Bid</th>
            <th className="px-6 py-5 text-right md:px-8">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/5">
          {gate ? (
            <tr>
              <td className="px-6 py-10 md:px-8" colSpan={colSpan}>
                {gate}
              </td>
            </tr>
          ) : isLoading ? (
            <tr>
              <td className="px-6 py-10 text-on-surface-variant md:px-8" colSpan={colSpan}>
                Loading…
              </td>
            </tr>
          ) : entries.length === 0 && showMockRows ? (
            ACTIVE_QUEUE_MOCK_ROWS.map((row) => <MockActiveQueueTableRow key={row.id} row={row} />)
          ) : entries.length === 0 ? (
            <tr>
              <td className="px-6 py-10 text-on-surface-variant md:px-8" colSpan={colSpan}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <ActiveQueueTableRow
                key={entry.auctionId}
                entry={entry}
                onPlaceBid={(wei) => onPlaceBid(entry, wei)}
                onClaim={() => onClaim(entry)}
              />
            ))
          )}
        </tbody>
      </table>
    </LiquidationTableSection>
  );
}
