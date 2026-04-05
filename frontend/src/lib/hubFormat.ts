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

const MAX_UINT256 = 2n ** 256n - 1n;

/** On-chain / indexed health factor as WAD bigint → display (2 decimals, or ∞ if max uint). */
export function formatHealthFactorWadBigint(hf: bigint | undefined): string {
  if (hf === undefined) return "—";
  if (hf === MAX_UINT256) return "∞";
  const x = Number(hf) / 1e18;
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(2);
}

/** Indexed health factor WAD → display string */
export function formatHealthFactorWad(wadStr: string | null | undefined): string {
  if (!wadStr) return "—";
  try {
    return formatHealthFactorWadBigint(BigInt(wadStr));
  } catch {
    return "—";
  }
}

/** Prefer live engine read; fall back to indexer/API string when the call fails or is unavailable. */
export function formatDisplayHealthFactor(
  liveHf: bigint | undefined,
  liveFailed: boolean,
  indexedWad: string | null | undefined,
): string {
  if (liveHf !== undefined && !liveFailed) {
    return formatHealthFactorWadBigint(liveHf);
  }
  return formatHealthFactorWad(indexedWad);
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

/** `Card.latestPriceUsdc`: 6-decimal USDC integer (JSON string from API). */
export function priceUsdc6ToUsdNumber(raw: string | number | null | undefined): number {
  if (raw == null || raw === "") return 0;
  try {
    const n = Number(BigInt(String(raw))) / 1e6;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Display USD for a collateral row: hub oracle `latestPriceUsd` first, else catalog `card.latestPriceUsdc`.
 */
export function collateralLatestUsdNumber(c: {
  latestPriceUsd?: string | null;
  card?: { latestPriceUsdc?: string | null } | null;
}): number {
  const oracle = price8ToUsdNumber(c.latestPriceUsd ?? undefined);
  if (oracle > 0) return oracle;
  return priceUsdc6ToUsdNumber(c.card?.latestPriceUsdc ?? undefined);
}

/** `Card.grade` is stored ×10 (e.g. 95 → 9.5). Whole numbers stay integer; else one decimal. */
export function formatCardGradeDisplay(storedGrade: number): string {
  const v = storedGrade / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** `ltvBps` is LTV in basis points (10000 = 100%; e.g. 5000 → 50%). */
export function formatLtvPercentFromBps(ltvBps: number | null | undefined): string | null {
  if (ltvBps == null) return null;
  const p = ltvBps / 100;
  if (!Number.isFinite(p)) return null;
  return Number.isInteger(p) ? String(p) : p.toFixed(1);
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
export function healthFactorBarPercentFromWadBigint(hf: bigint | undefined): number {
  if (hf === undefined) return 0;
  const n = Number(hf) / 1e18;
  if (!Number.isFinite(n) || n <= 0) return 0;
  const clamped = Math.min(n / 2, 1);
  return Math.round(clamped * 100);
}

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
