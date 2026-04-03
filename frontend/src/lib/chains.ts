import { defineChain } from "viem";
import { sepolia as sepoliaChain } from "viem/chains";
import { ARC_TESTNET_CHAIN_ID, testnetConfig } from "@slabfinance/shared";

export const sepolia = defineChain({
  ...sepoliaChain,
  rpcUrls: {
    default: { http: [testnetConfig.source.rpcUrl] },
  },
});

const arcTestnetBase = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [testnetConfig.hub.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: testnetConfig.hub.blockExplorer,
    },
  },
});

export const arcTestnet = arcTestnetBase;

export { ARC_TESTNET_CHAIN_ID };
