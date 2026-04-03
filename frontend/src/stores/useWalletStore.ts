import { create } from "zustand";

export interface WalletStore {
  hubAddress: `0x${string}` | null;
  polygonAddress: `0x${string}` | null;
  setHubAddress: (addr: `0x${string}` | null) => void;
  setPolygonAddress: (addr: `0x${string}` | null) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  hubAddress: null,
  polygonAddress: null,
  setHubAddress: (addr) => set({ hubAddress: addr }),
  setPolygonAddress: (addr) => set({ polygonAddress: addr }),
}));
