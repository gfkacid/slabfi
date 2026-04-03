import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BidModalPayload, ModalState, ModalType } from "./modalTypes";

type ModalContextValue = {
  openModal: (type: ModalType, payload?: BidModalPayload) => void;
  closeModal: () => void;
  state: ModalState | null;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const openModal = useCallback((type: ModalType, payload?: BidModalPayload) => {
    if (type === "bid") {
      if (!payload) throw new Error("Bid modal requires a payload");
      setState({ type: "bid", payload });
      return;
    }
    setState({ type: "collateralDeposit" });
  }, []);

  const closeModal = useCallback(() => setState(null), []);

  const value = useMemo(
    () => ({ openModal, closeModal, state }),
    [openModal, closeModal, state],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within ModalProvider");
  }
  const { openModal, closeModal } = ctx;
  return { openModal, closeModal };
}

export function useModalState() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModalState must be used within ModalProvider");
  }
  return ctx;
}
