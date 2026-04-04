/**
 * Map on-chain card grade (uint16: 100 = 10.0) + grading service to PriceCharting JSON keys.
 * @see https://www.pricecharting.com/api-documentation#columns
 */
export function pricechartingFieldForGrade(
  gradeService: string | null | undefined,
  grade: number | null | undefined,
): string {
  const svc = (gradeService ?? "").trim().toUpperCase();
  const g = grade ?? 0;

  if (!svc || g === 0) {
    return "loose-price";
  }

  if (g >= 100) {
    if (svc === "BGS") return "bgs-10-price";
    if (svc === "CGC") return "condition-17-price";
    if (svc === "SGC") return "condition-18-price";
    return "manual-only-price";
  }
  if (g >= 95) return "box-only-price";
  if (g >= 90) return "graded-price";
  if (g >= 80) return "new-price";
  if (g >= 70) return "cib-price";
  return "cib-price";
}

export type PricechartingProductJson = {
  status?: string;
  "error-message"?: string;
  [key: string]: unknown;
};

export function readPenniesFromProduct(
  body: PricechartingProductJson,
  field: string,
): number | null {
  if (body.status === "error") {
    return null;
  }
  const raw = body[field];
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    return null;
  }
  return Math.trunc(raw);
}

/** PriceCharting pennies ($1.23 → 123) → 6-decimal USDC integer */
export function penniesToPriceUsdc(pennies: number): bigint {
  return BigInt(pennies) * 10_000n;
}

/** 6-decimal USDC → on-chain oracle 8-decimal USD */
export function priceUsdcToOracle8(priceUsdc: bigint): bigint {
  return priceUsdc * 100n;
}
