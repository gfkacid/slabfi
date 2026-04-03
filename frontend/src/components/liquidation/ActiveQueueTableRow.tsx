import { formatUnits } from "viem";
import { useCollateralItem, useMinBidIncrementBPS } from "@/hooks";
import { useModal } from "@/components/modal";
import { Icon } from "@/components/ui/Icon";
import { LIQUIDATION_BID_BUTTON_CLASS } from "./liquidationConstants";

function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
}

function shortHexId(hex: string) {
  if (!hex || hex.length < 14) return hex;
  return `${hex.slice(0, 6)}...${hex.slice(-4)}`;
}

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export type AuctionRow = {
  auctionId: `0x${string}`;
  borrower: `0x${string}`;
  collateralId: `0x${string}`;
  startedAt: bigint;
  deadline: bigint;
  reservePrice: bigint;
  debtShareSnapshot: bigint;
  feeSnapshot: bigint;
  highestBid: bigint;
  highestBidder: `0x${string}`;
  settled: boolean;
  cancelled: boolean;
};

/** @deprecated Use `AuctionRow` */
export type LiquidationEntryRow = AuctionRow;

type ActiveQueueTableRowProps = {
  entry: AuctionRow;
  onPlaceBid: (amountWei: bigint) => Promise<void>;
  onClaim: () => Promise<void>;
};

function ceilMinNextBid(highestBid: bigint, incrementBps: bigint): bigint {
  if (highestBid === 0n) return 0n;
  const num = highestBid * (10000n + incrementBps);
  const den = 10000n;
  const q = num / den;
  return q * den === num ? q : q + 1n;
}

export function ActiveQueueTableRow({ entry, onPlaceBid, onClaim }: ActiveQueueTableRowProps) {
  const { openModal } = useModal();
  const { data: item } = useCollateralItem(entry.collateralId);
  const { data: incBps } = useMinBidIncrementBPS();
  const incrementBps = incBps ?? 100n;

  const now = Math.floor(Date.now() / 1000);
  const deadlineSec = Number(entry.deadline);
  const hasBid = entry.highestBid > 0n;
  const canBid = !hasBid || now < deadlineSec;
  const canClaim = hasBid && now >= deadlineSec;
  const countdown = hasBid ? Math.max(0, deadlineSec - now) : Math.max(0, deadlineSec - now);

  const minNext = hasBid ? ceilMinNextBid(entry.highestBid, incrementBps) : entry.reservePrice;
  const displayBidTarget = hasBid ? minNext : entry.reservePrice;

  const debtLabel = `${Number(formatUnits(entry.debtShareSnapshot, 18)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDC`;
  const bidLabel = `${Number(formatUnits(displayBidTarget, 18)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDC`;

  const title =
    item !== undefined
      ? `Token #${item.tokenId.toString()}`
      : shortHexId(entry.collateralId);

  return (
    <tr className="transition-colors hover:bg-surface-container-high">
      <td className="px-6 py-6 md:px-8">
        <div className="flex items-center gap-4">
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-outline-variant/20">
            <div className="flex h-full w-full items-center justify-center text-2xl text-on-surface-variant/40">
              🃏
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-headline truncate font-bold text-primary">{title}</p>
            <p className="font-mono text-xs text-on-surface-variant">{shortAddr(entry.borrower)}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <span className="font-bold text-primary">{debtLabel}</span>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full bg-error ${canBid ? "animate-pulse" : ""}`}
            aria-hidden
          />
          <span className="font-bold text-error">&lt; 1.00</span>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-on-surface">
          <Icon name="schedule" className="text-sm" />
          {canClaim ? (
            <span>Ended</span>
          ) : hasBid ? (
            <span className="tabular-nums">{formatCountdown(countdown)}</span>
          ) : (
            <span className="text-on-surface-variant">Open (no bids)</span>
          )}
        </div>
      </td>
      <td className="px-6 py-6">
        <span className="font-bold text-primary">{bidLabel}</span>
      </td>
      <td className="px-6 py-6 text-right md:px-8">
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
          {canBid ? (
            <button
              type="button"
              className={LIQUIDATION_BID_BUTTON_CLASS}
              onClick={() =>
                openModal("bid", {
                  variant: "live",
                  entry,
                  onPlaceBid,
                })
              }
            >
              Bid
            </button>
          ) : null}
          {canClaim ? (
            <button
              type="button"
              className="rounded-lg border-2 border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
              onClick={() => void onClaim()}
            >
              Claim
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
