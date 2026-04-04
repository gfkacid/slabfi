import { formatUnits } from "viem";
import { HUB_USDC_DECIMALS } from "@slabfinance/shared";

const WAD = 10n ** 18n;

export { HUB_USDC_DECIMALS };

/** Format hub USDC / pool raw amounts (6 decimals). */
export function formatUsdc(value: bigint | undefined): string {
  if (value === undefined) return "—";
  const n = Number(formatUnits(value, HUB_USDC_DECIMALS));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** @deprecated Use formatUsdc */
export const formatUsd18 = formatUsdc;

/** utilization() returns WAD-scaled fraction (1e18 = 100%). */
export function utilizationPercentFromWad(wad: bigint | undefined): number | undefined {
  if (wad === undefined) return undefined;
  return Number((wad * 100n) / WAD);
}

export function aprPercentFromBps(bps: bigint | undefined): string {
  if (bps === undefined) return "—";
  const n = Number(bps) / 100;
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

/** Protocol snapshot / API string bigint → percent utilization */
export function utilizationPercentFromSnapshotWad(wadStr: string | undefined): number | undefined {
  if (!wadStr) return undefined;
  try {
    return utilizationPercentFromWad(BigInt(wadStr));
  } catch {
    return undefined;
  }
}

export function formatUsdcFromSnapshotString(raw: string | undefined): string {
  if (!raw) return "—";
  try {
    return formatUsdc(BigInt(raw));
  } catch {
    return "—";
  }
}

/** @deprecated Use formatUsdcFromSnapshotString */
export const formatUsdFromSnapshotString = formatUsdcFromSnapshotString;

export function aprPercentFromSnapshotBps(bpsStr: string | undefined): string {
  if (!bpsStr) return "—";
  try {
    return aprPercentFromBps(BigInt(bpsStr));
  } catch {
    return "—";
  }
}

/** Indexed health factor WAD → display string */
export function formatHealthFactorWad(wadStr: string | null | undefined): string {
  if (!wadStr) return "—";
  try {
    const hf = BigInt(wadStr);
    const max = 2n ** 256n - 1n;
    if (hf === max) return "∞";
    const x = Number(hf) / 1e18;
    if (!Number.isFinite(x)) return "—";
    return x.toFixed(2);
  } catch {
    return "—";
  }
}

/** Oracle / indexer price (8 decimals USD). */
export function price8ToUsdNumber(price8: string | null | undefined): number {
  if (!price8) return 0;
  try {
    const n = Number(BigInt(price8)) / 1e8;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function formatUsdNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatRelativeTimeSecs(tsStr: string | undefined): string {
  if (!tsStr) return "—";
  const sec = Number(tsStr);
  if (!Number.isFinite(sec)) return "—";
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Map health factor (wad string) to 0–100 progress bar width. */
export function healthFactorBarPercent(hfStr: string | null | undefined): number {
  if (!hfStr) return 0;
  try {
    const hf = Number(BigInt(hfStr)) / 1e18;
    if (!Number.isFinite(hf) || hf <= 0) return 0;
    const clamped = Math.min(hf / 2, 1);
    return Math.round(clamped * 100);
  } catch {
    return 0;
  }
}
