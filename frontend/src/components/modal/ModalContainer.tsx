import { useModalState } from "./modalContext";
import { BidModal } from "./BidModal";
import { CollateralDepositModal } from "./CollateralDepositModal";

export function ModalContainer() {
  const { state, closeModal } = useModalState();

  if (!state) return null;

  switch (state.type) {
    case "bid":
      return <BidModal payload={state.payload} onClose={closeModal} />;
    case "collateralDeposit":
      return <CollateralDepositModal onClose={closeModal} />;
    default:
      return null;
  }
}
