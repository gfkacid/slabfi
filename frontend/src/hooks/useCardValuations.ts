import { useQueries } from "@tanstack/react-query";
import type { SlabCollectible } from "@slabfinance/shared";

const base = import.meta.env.VITE_EXTERNAL_PRICE_API_BASE as string | undefined;

export type CardValuation = {
  priceUSD: number;
  ltvBPS: number;
  tier: number;
  confidence?: string;
  volatility30dBPS?: number;
  updatedAt?: string;
};

export async function fetchCardValuation(
  collection: `0x${string}`,
  tokenId: string
): Promise<CardValuation | null> {
  if (!base?.trim()) return null;
  const url = `${base.replace(/\/$/, "")}/api/v1/cards/${collection}/${tokenId}/valuation`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as Partial<CardValuation>;
  if (
    typeof data.priceUSD !== "number" ||
    typeof data.ltvBPS !== "number" ||
    typeof data.tier !== "number"
  ) {
    return null;
  }
  return {
    priceUSD: data.priceUSD,
    ltvBPS: data.ltvBPS,
    tier: data.tier,
    confidence: typeof data.confidence === "string" ? data.confidence : undefined,
    volatility30dBPS:
      typeof data.volatility30dBPS === "number" ? data.volatility30dBPS : undefined,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
  };
}

/** priceUSD from API is in cents (see specs/nft-collateral-deposit.md). */
export function maxBorrowUsdFromValuation(v: CardValuation): number {
  return (v.priceUSD / 100) * (v.ltvBPS / 10000);
}

export function useCardValuations(nfts: SlabCollectible[] | undefined, enabled: boolean) {
  return useQueries({
    queries: (nfts ?? []).map((nft) => ({
      queryKey: ["card-valuation", nft.collection, nft.tokenId],
      queryFn: () => fetchCardValuation(nft.collection as `0x${string}`, nft.tokenId),
      enabled: enabled && !!base?.trim() && !!nft.collection,
      staleTime: 30_000,
    })),
  });
}

export function isPricingApiConfigured(): boolean {
  return !!base?.trim();
}
