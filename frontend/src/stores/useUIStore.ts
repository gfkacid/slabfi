import { create } from "zustand";
import type { ModalId } from "@slabfinance/shared";

export interface UIStore {
  isLoading: boolean;
  modal: ModalId;
  setLoading: (loading: boolean) => void;
  openModal: (id: ModalId) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isLoading: false,
  modal: null,
  setLoading: (loading) => set({ isLoading: loading }),
  openModal: (id) => set({ modal: id }),
  closeModal: () => set({ modal: null }),
}));
