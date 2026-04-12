import { HUB_USDC_DECIMALS } from "@slabfinance/shared";
import { formatUnits, parseUnits } from "viem";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useLiquidationCollateralDisplay, useMinBidIncrementBPS } from "@/hooks";
import { BaseModal } from "./BaseModal";
import type { BidModalPayload } from "./modalTypes";
import { Icon } from "@/components/ui/Icon";
import { TransactionButton } from "@/components/TransactionButton";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";
import { CollateralImageFill } from "@/components/shared/lending/CollateralImageFill";

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function formatUsdcAmount(value: bigint) {
  return Number(formatUnits(value, HUB_USDC_DECIMALS)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ceilMinNextBid(highestBid: bigint, incrementBps: bigint): bigint {
  if (highestBid === 0n) return 0n;
  const num = highestBid * (10000n + incrementBps);
  const den = 10000n;
  const q = num / den;
  return q * den === num ? q : q + 1n;
}

type BidModalProps = {
  payload: BidModalPayload;
  onClose: () => void;
};

export function BidModal({ payload, onClose }: BidModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const usdcAddr = hubContracts.usdc;
  const onHub = isHubEvm(chainId);
  const { data: usdcBal } = useBalance({
    address,
    token: usdcAddr || undefined,
    chainId: hubChain.id,
    query: { enabled: Boolean(address && usdcAddr && onHub) },
  });
  const { data: incBps } = useMinBidIncrementBPS();
  const incrementBps = incBps ?? 100n;

  const [bidInput, setBidInput] = useState("");
  const [placePending, setPlacePending] = useState(false);

  const entry = payload.entry;
  const collateralDisplay = useLiquidationCollateralDisplay(entry.collateralId);

  const hasBid = entry.highestBid > 0n;
  const minAmountWei = useMemo(() => {
    return hasBid ? ceilMinNextBid(entry.highestBid, incrementBps) : entry.reservePrice;
  }, [entry, hasBid, incrementBps]);

  useEffect(() => {
    setBidInput(formatUsdcAmount(minAmountWei).replace(/,/g, ""));
  }, [entry.auctionId, minAmountWei]);

  const deadlineSec = Number(entry.deadline);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, [entry.auctionId]);

  const canPlace = !hasBid || nowSec < deadlineSec;
  const countdownSec = hasBid ? Math.max(0, deadlineSec - nowSec) : 0;

  const vaultLine = `${entry.borrower.slice(0, 5)}…${entry.borrower.slice(-4)}`;

  const currentBidAmount =
    entry.highestBid > 0n ? formatUsdcAmount(entry.highestBid) : "—";

  const secondaryStatLabel = "Liquidation fee (on debt)";
  const secondaryStatValue = `${formatUsdcAmount(entry.feeSnapshot)} USDC`;

  const balanceLabel = usdcBal?.formatted
    ? `${Number(usdcBal.formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
    : onHub && address
      ? "0.00 USDC"
      : "—";

  const handlePlaceBid = useCallback(async () => {
    let wei: bigint;
    try {
      wei = parseUnits(bidInput.replace(/,/g, "").trim() || "0", HUB_USDC_DECIMALS);
    } catch {
      return;
    }
    if (wei < minAmountWei) return;
    setPlacePending(true);
    try {
      await payload.onPlaceBid(wei);
      onClose();
    } finally {
      setPlacePending(false);
    }
  }, [bidInput, minAmountWei, onClose, payload]);

  let parseOk = true;
  try {
    const w = parseUnits(bidInput.replace(/,/g, "").trim() || "0", HUB_USDC_DECIMALS);
    if (w < minAmountWei) parseOk = false;
  } catch {
    parseOk = false;
  }

  const placeDisabled = !canPlace || Boolean(placePending) || !parseOk;

  const footerNote = useMemo(
    () =>
      "Bids cannot be withdrawn until the auction settles or is cancelled (e.g. borrower cures). Protocol fee on debt share goes to treasury; any premium is split per contract.",
    [],
  );

  return (
    <BaseModal open title="Place Your Bid" onClose={onClose}>
      <div className="flex gap-6">
        <div className="h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-surface shadow-md ring-1 ring-outline-variant/20">
          <CollateralImageFill
            src={collateralDisplay.imageUrl}
            alt={collateralDisplay.imageAlt}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
            Active auction
          </span>
          <h4 className="font-headline text-2xl font-extrabold leading-tight text-primary">
            {collateralDisplay.title}
          </h4>
          {collateralDisplay.gradeLine ? (
            <p className="mt-0.5 truncate font-headline text-sm font-extrabold text-secondary">
              {collateralDisplay.gradeLine}
            </p>
          ) : null}
          {collateralDisplay.subtitle ? (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-on-surface-variant">
              {collateralDisplay.subtitle}
            </p>
          ) : null}
          {collateralDisplay.hasCatalog ? (
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
              Latest price{" "}
              <span className="font-headline text-primary">{collateralDisplay.valuation}</span>
              {collateralDisplay.ltvPercentLabel !== "—" ? (
                <span>
                  {" "}
                  · LTV {collateralDisplay.ltvPercentLabel}%
                </span>
              ) : null}
            </p>
          ) : null}
          <p className="mt-1 font-mono text-xs text-on-surface-variant">{vaultLine}</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-error">
            <Icon name="schedule" className="text-sm" />
            {!hasBid ? (
              <span>Open — no bids yet (stays open until first bid)</span>
            ) : canPlace ? (
              <span className="tabular-nums">{formatCountdown(countdownSec)} until deadline</span>
            ) : (
              <span>Deadline passed — bid on another auction or claim if you won</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-surface-container-low p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Current highest bid
          </p>
          <p className="font-headline text-xl font-extrabold text-primary">
            {currentBidAmount}{" "}
            <span className="text-xs font-bold uppercase text-on-surface-variant">USDC</span>
          </p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            {secondaryStatLabel}
          </p>
          <p className="font-headline text-xl font-extrabold text-primary">
            {secondaryStatValue.replace(/\s*USDC\s*/i, "").trim()}{" "}
            <span className="text-xs font-bold uppercase text-on-surface-variant">USDC</span>
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <div className="mb-2 flex items-end justify-between gap-2">
            <label htmlFor="bid-amount-input" className="text-sm font-bold text-primary">
              Your bid amount
            </label>
            <span className="text-[11px] font-semibold text-on-surface-variant">
              Wallet balance:{" "}
              <span className="font-bold text-primary">{balanceLabel}</span>
            </span>
          </div>
          <div className="relative">
            <input
              id="bid-amount-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={bidInput}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d*$/.test(v)) setBidInput(v);
              }}
              placeholder="0.00"
              className="w-full rounded-lg border-2 border-outline-variant/30 bg-surface-container-lowest py-4 pl-4 pr-36 font-headline text-xl font-extrabold text-primary placeholder:text-outline-variant transition-all focus:border-secondary focus:outline-none focus:ring-0"
            />
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <span className="text-sm font-bold text-on-surface-variant">USDC</span>
              <button
                type="button"
                disabled={!usdcBal?.formatted}
                onClick={() => setBidInput(usdcBal?.formatted.replace(/,/g, "") ?? "")}
                className="rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Max
              </button>
            </div>
          </div>
        </div>

        <TransactionButton
          onClick={handlePlaceBid}
          isLoading={Boolean(placePending)}
          disabled={placeDisabled}
          variant="primary"
          className="mt-2 w-full !bg-secondary !py-4 !text-lg !font-extrabold !text-on-secondary shadow-lg hover:!bg-secondary-container focus:!ring-secondary disabled:!opacity-50"
        >
          Place bid
        </TransactionButton>
        <p className="text-center text-[11px] font-medium text-on-surface-variant">{footerNote}</p>
      </div>
    </BaseModal>
  );
}
