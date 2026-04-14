import { defineChain } from "viem";
import { base, polygon } from "viem/chains";
import { protocolConfig } from "@slabfinance/shared";

const polyRpc = protocolConfig.evmSources.polygon.rpcUrl;
const baseRpc = protocolConfig.evmSources.base.rpcUrl;

/** Polygon mainnet — Courtyard / Polygon-native collateral locks. */
export const polygonMainnet = defineChain({
  ...polygon,
  rpcUrls: { default: { http: [polyRpc] } },
});

/** Base mainnet — Beezie / Base-native collateral locks. */
export const baseMainnet = defineChain({
  ...base,
  rpcUrls: { default: { http: [baseRpc] } },
});

/** All EVM chains the app registers for Wagmi (lock + adapter flows). */
export const evmAppChains = [polygonMainnet, baseMainnet] as const;

/** Default chain for lock UI when the wallet is not on a configured EVM network. */
export const defaultLockChain = polygonMainnet;

/** Placeholder EVM chain id for wagmi until hub reads move fully to Solana. Do not use for RPC. */
export const slabHubPlaceholder = defineChain({
  id: 575_757,
  name: "Slab Hub (Solana)",
  nativeCurrency: { name: "SOL", symbol: "SOL", decimals: 9 },
  rpcUrls: {
    default: { http: [protocolConfig.hub.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Solana Explorer", url: protocolConfig.hub.blockExplorer },
  },
});
