/** Backend read API (Nest). BigInt fields are JSON decimal strings. */

export function getApiBase(): string | null {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (!base) return null;
  return base.replace(/\/$/, "");
}

export function isApiConfigured(): boolean {
  return getApiBase() !== null;
}

async function apiGet<T>(path: string): Promise<T> {
  const base = getApiBase();
  if (!base) {
    throw new Error("VITE_API_BASE is not set");
  }
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    throw new Error(`API ${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type ProtocolSnapshotJson = {
  id: string;
  hubChainId: string;
  totalAssets: string;
  totalBorrows: string;
  utilizationWad: string;
  borrowAprBps: string;
  supplyAprBps: string;
  exchangeRateWad: string;
  blockNumber: string;
  timestampUnix: string;
  totalSupplyShares?: string | null;
  depositorCount?: number | null;
  positionCount?: number | null;
};

export type ProtocolStatsResponse = {
  hubChainId: string;
  latestSnapshot: ProtocolSnapshotJson | null;
  positionCount: number;
  depositorCount: number;
};

export type CollateralItemJson = {
  id: string;
  hubChainId: string;
  sourceChainId: string;
  collection: string;
  tokenId: string;
  owner: string;
  status: number;
  lockedAtUnix: string;
  latestPriceUsd?: string | null;
  tokenUri?: string | null;
  cardName?: string | null;
  cardImage?: string | null;
};

export type PositionJson = {
  borrower: string;
  hubChainId: string;
  collateralIdsJson: string;
  principal: string;
  interestAccrued: string;
  lastInterestUpdateUnix: string;
  status: number;
  healthFactorWad?: string | null;
};

export type PositionDetailResponse = {
  hubChainId: string;
  borrower: string;
  indexedPosition: PositionJson | null;
  collaterals: CollateralItemJson[];
  live: {
    availableCredit: string | null;
    positionStatus: number | null;
  };
};

export type BidJson = {
  id: string;
  auctionId: string;
  bidder: string;
  amount: string;
  newDeadlineUnix: string;
  txHash: string;
  blockNumber: string;
  logIndex: number;
  timestampUnix: string;
};

export type AuctionSettlementJson = {
  auctionId: string;
  winner: string;
  winningBid: string;
  debtToPool: string;
  feeToTreasury: string;
  excessToPool: string;
  excessToTreasury: string;
  txHash: string;
  timestampUnix: string;
};

export type AuctionJson = {
  id: string;
  hubChainId: string;
  borrower: string;
  collateralId: string;
  startedAtUnix: string;
  deadlineUnix: string;
  reservePrice: string;
  debtShareSnapshot: string;
  feeSnapshot: string;
  highestBid: string;
  highestBidder: string;
  settled: boolean;
  cancelled: boolean;
  bids?: BidJson[];
  settlement?: AuctionSettlementJson | null;
};

export type AuctionHistoryResponse = {
  items: AuctionJson[];
  total: number;
  page: number;
  limit: number;
};

export type ActivityFeedItem = {
  source: "activity" | "pool";
  timestampUnix: string;
  row: Record<string, unknown>;
};

export type ActivityFeedResponse = {
  page: number;
  limit: number;
  items: ActivityFeedItem[];
};

export function fetchProtocolStats(): Promise<ProtocolStatsResponse> {
  return apiGet<ProtocolStatsResponse>("/protocol/stats");
}

export function fetchProtocolSnapshots(
  period: "24h" | "7d" | "30d" = "24h",
): Promise<ProtocolSnapshotJson[]> {
  return apiGet<ProtocolSnapshotJson[]>(`/protocol/snapshots?period=${period}`);
}

export function fetchPosition(address: string): Promise<PositionDetailResponse> {
  const a = encodeURIComponent(address);
  return apiGet<PositionDetailResponse>(`/positions/${a}`);
}

export function fetchActiveAuctions(): Promise<AuctionJson[]> {
  return apiGet<AuctionJson[]>("/auctions/active");
}

export function fetchAuctionHistory(
  page = 1,
  limit = 20,
): Promise<AuctionHistoryResponse> {
  return apiGet<AuctionHistoryResponse>(
    `/auctions/history?page=${page}&limit=${limit}`,
  );
}

export function fetchCollateralByOwner(address: string): Promise<CollateralItemJson[]> {
  const a = encodeURIComponent(address);
  return apiGet<CollateralItemJson[]>(`/collateral/by-owner/${a}`);
}

export function fetchCollateralCatalog(): Promise<CollateralItemJson[]> {
  return apiGet<CollateralItemJson[]>("/collateral/catalog");
}

export function fetchActivity(
  address: string,
  page = 1,
  limit = 20,
): Promise<ActivityFeedResponse> {
  const a = encodeURIComponent(address);
  return apiGet<ActivityFeedResponse>(
    `/activity/${a}?page=${page}&limit=${limit}`,
  );
}
