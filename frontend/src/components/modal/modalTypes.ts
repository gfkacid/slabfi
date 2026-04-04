import type { AuctionRow } from "@/components/liquidation/ActiveQueueTableRow";

export type BidModalPayload = {
  entry: AuctionRow;
  onPlaceBid: (amountWei: bigint) => Promise<void>;
};

export type ModalType = "bid" | "collateralDeposit";

export type ModalState =
  | { type: "bid"; payload: BidModalPayload }
  | { type: "collateralDeposit" };
