/** Mirrors `PositionStatus` in ICardFiTypes.sol */
export enum PositionStatus {
  HEALTHY = 0,
  WARNING = 1,
  LIQUIDATABLE = 2,
  CLOSED = 3,
}

/** On-chain position tuple shape (viem readContract) */
export interface Position {
  borrower: `0x${string}`;
  collateralIds: readonly `0x${string}`[];
  principal: bigint;
  interestAccrued: bigint;
  lastInterestUpdate: bigint;
  status: number;
}
