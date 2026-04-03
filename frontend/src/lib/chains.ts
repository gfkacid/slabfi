import { defineChain } from "viem";
import { sepolia as sepoliaChain, arbitrumSepolia as arbitrumSepoliaChain } from "viem/chains";
import { ARC_TESTNET_CHAIN_ID } from "@slabfinance/shared";

export const sepolia = sepoliaChain;

export const arbitrumSepolia = arbitrumSepoliaChain;

const arcRpcOverride = import.meta.env.VITE_ARC_TESTNET_RPC_URL;

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
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
});

export const arcTestnet = arcRpcOverride
  ? defineChain({
      ...arcTestnetBase,
      rpcUrls: {
        default: { http: [arcRpcOverride] },
      },
    })
  : arcTestnetBase;

export { ARC_TESTNET_CHAIN_ID };
