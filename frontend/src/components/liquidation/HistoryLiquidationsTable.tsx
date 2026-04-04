import { formatUnits } from "viem";
import { Icon } from "@/components/ui/Icon";
import { LiquidationTableSection } from "./LiquidationTableSection";
import { useAuctionHistory } from "@/hooks";
import { hubChain } from "@/lib/hub";
import { isApiConfigured } from "@/lib/api";

const theadClass =
  "border-b border-outline-variant/10 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-on-primary-container";

export function HistoryLiquidationsTable() {
  const { data, isLoading, isError } = useAuctionHistory(1, 30);

  const explorerBase = hubChain.blockExplorers?.default?.url?.replace(/\/$/, "") ?? "";

  return (
    <LiquidationTableSection>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className={theadClass}>
            <th className="px-6 py-5 md:px-8">Status</th>
            <th className="px-6 py-5">Auction</th>
            <th className="px-6 py-5">Winning Bid</th>
            <th className="px-6 py-5">Settled</th>
            <th className="px-6 py-5 text-right md:px-8">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/5">
          {!isApiConfigured() ? (
            <tr>
              <td className="px-6 py-10 text-on-surface-variant md:px-8" colSpan={5}>
                Set VITE_API_BASE to load auction history from the indexer.
              </td>
            </tr>
          ) : isLoading ? (
            <tr>
              <td className="px-6 py-10 md:px-8" colSpan={5}>
                <div className="h-8 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td className="px-6 py-10 text-error md:px-8" colSpan={5}>
                Could not load history.
              </td>
            </tr>
          ) : !data?.items.length ? (
            <tr>
              <td className="px-6 py-10 text-on-surface-variant md:px-8" colSpan={5}>
                No settled or cancelled auctions in the indexer.
              </td>
            </tr>
          ) : (
            data.items.map((row) => {
              const settled = row.settled;
              const statusLabel = row.cancelled ? "Cancelled" : settled ? "Settled" : "Closed";
              const winRaw = row.settlement?.winningBid ?? row.highestBid;
              const win = BigInt(winRaw);
              const winStr = `${Number(formatUnits(win, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
              const ts = row.settlement?.timestampUnix ?? row.deadlineUnix;
              const tx = row.settlement?.txHash;
              const href = explorerBase && tx ? `${explorerBase}/tx/${tx}` : undefined;
              const dateStr =
                ts !== undefined
                  ? new Date(Number(ts) * 1000).toLocaleString()
                  : "—";

              return (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-surface-container-high"
                >
                  <td className="px-6 py-6 md:px-8">
                    <div className="flex items-center gap-2">
                      <Icon
                        name={settled ? "check_circle" : "cancel"}
                        className={`text-lg ${settled ? "text-tertiary-fixed-dim" : "text-on-surface-variant"}`}
                      />
                      <span className="text-sm font-bold text-on-tertiary-container">{statusLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-primary font-mono">{row.id.slice(0, 10)}…</p>
                    <p className="text-xs text-on-surface-variant">{row.collateralId.slice(0, 10)}…</p>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-bold text-primary">{winStr}</span>
                  </td>
                  <td className="px-6 py-6 text-sm font-medium text-on-surface-variant">{dateStr}</td>
                  <td className="px-6 py-6 text-right md:px-8">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-bold text-secondary hover:underline"
                      >
                        View on Scan
                        <Icon name="open_in_new" className="text-sm" />
                      </a>
                    ) : (
                      <span className="text-sm text-on-surface-variant">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </LiquidationTableSection>
  );
}
