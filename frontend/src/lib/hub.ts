import type { Chain } from "viem";
import type { HubNetwork } from "@slabfinance/shared";
import { arcTestnet, arbitrumSepolia } from "./chains";
import { CONTRACT_ADDRESSES } from "./contracts";

const raw = import.meta.env.VITE_HUB_NETWORK;

export const HUB_NETWORK: HubNetwork =
  raw === "arbitrumSepolia" ? "arbitrumSepolia" : "arc";

const hubChains: Record<HubNetwork, Chain> = {
  arc: arcTestnet,
  arbitrumSepolia,
};

export const hubChain = hubChains[HUB_NETWORK];
export const hubContracts = CONTRACT_ADDRESSES[HUB_NETWORK];
