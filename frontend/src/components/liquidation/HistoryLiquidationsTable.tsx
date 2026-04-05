import { HUB_USDC_DECIMALS } from "@slabfinance/shared";
import { formatUnits } from "viem";
import { Icon } from "@/components/ui/Icon";
import { CollateralImageFill } from "@/components/shared/lending/CollateralImageFill";
import { LiquidationTableSection } from "./LiquidationTableSection";
import { useAuctionHistory, useLiquidationCollateralDisplay } from "@/hooks";
import { hubChain } from "@/lib/hub";
import { isApiConfigured } from "@/lib/api";

const theadClass =
  "border-b border-outline-variant/10 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-on-primary-container";

function HistoryAuctionAssetCell({
  collateralId,
  auctionIdLabel,
}: {
  collateralId: string;
  auctionIdLabel: string;
}) {
  const d = useLiquidationCollateralDisplay(collateralId as `0x${string}`);
  return (
    <div className="flex items-center gap-3">
      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-outline-variant/20">
        <CollateralImageFill
          src={d.imageUrl}
          alt={d.imageAlt}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-headline text-sm font-bold text-primary">{d.title}</p>
        {d.gradeLine ? (
          <p className="truncate font-headline text-[11px] font-extrabold text-secondary">{d.gradeLine}</p>
        ) : null}
        {d.subtitle ? (
          <p className="truncate text-xs text-on-surface-variant">{d.subtitle}</p>
        ) : null}
        <p className="font-mono text-[11px] text-on-surface-variant">{auctionIdLabel}</p>
      </div>
    </div>
  );
}

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
                Set VITE_API_BASE to load auction history.
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
                No settled or cancelled auctions on record.
              </td>
            </tr>
          ) : (
            data.items.map((row) => {
              const settled = row.settled;
              const statusLabel = row.cancelled ? "Cancelled" : settled ? "Settled" : "Closed";
              const winRaw = row.settlement?.winningBid ?? row.highestBid;
              const win = BigInt(winRaw);
              const winStr = `${Number(formatUnits(win, HUB_USDC_DECIMALS)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
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
                    <HistoryAuctionAssetCell
                      collateralId={row.collateralId}
                      auctionIdLabel={`Auction ${row.id.slice(0, 10)}…`}
                    />
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
