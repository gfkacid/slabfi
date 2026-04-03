/** Mirrors `CollateralStatus` in ICardFiTypes.sol */
export enum CollateralStatus {
  PENDING = 0,
  ACTIVE = 1,
  UNLOCK_SENT = 2,
  RELEASED = 3,
}

/** On-chain collateral tuple shape (viem readContract) */
export interface CollateralItem {
  id: `0x${string}`;
  sourceChainId: bigint;
  collection: `0x${string}`;
  tokenId: bigint;
  owner: `0x${string}`;
  lockedAt: bigint;
  status: number;
}
