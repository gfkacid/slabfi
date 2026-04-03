import type { AuctionRow } from "@/components/liquidation/ActiveQueueTableRow";
import type { ActiveQueueMockRow } from "@/components/liquidation/activeLiquidationMock";

export type BidModalPayload =
  | { variant: "live"; entry: AuctionRow; onPlaceBid: (amountWei: bigint) => Promise<void> }
  | { variant: "mock"; row: ActiveQueueMockRow };

export type ModalType = "bid" | "collateralDeposit";

export type ModalState =
  | { type: "bid"; payload: BidModalPayload }
  | { type: "collateralDeposit" };
