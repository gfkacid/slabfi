import type { HubContractAddresses, SepoliaContractAddresses } from "../types/contracts";

/** Single source of truth for Arc Testnet (hub) + Ethereum Sepolia (source). Fill contract addresses after deploy. */
export const testnetConfig = {
  hub: {
    chainId: 5042002,
    name: "Arc Testnet",
    rpcUrl: "https://rpc.testnet.arc.network",
    blockExplorer: "https://testnet.arcscan.app",
    ccipRouter: "0xdE4E7FED43FAC37EB21aA0643d9852f75332eab8" as const,
    ccipChainSelector: "3034092155422581607",
    contracts: {
      lendingPool: "",
      collateralRegistry: "",
      oracleConsumer: "",
      healthFactorEngine: "",
      liquidationManager: "",
      usdc: "",
    } satisfies Record<keyof HubContractAddresses, string>,
  },
  source: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59" as const,
    ccipChainSelector: "16015286601757825753",
    contracts: {
      collateralAdapter: "",
      slabFinanceCollectible: "",
      nftVault: "",
    },
  },
  cre: {
    forwarderAddress: "0x0000000000000000000000000000000000000001" as const,
  },
};

export function hubContractsFromConfig(): HubContractAddresses {
  const c = testnetConfig.hub.contracts;
  return {
    lendingPool: (c.lendingPool || "") as `0x${string}`,
    collateralRegistry: (c.collateralRegistry || "") as `0x${string}`,
    oracleConsumer: (c.oracleConsumer || "") as `0x${string}`,
    healthFactorEngine: (c.healthFactorEngine || "") as `0x${string}`,
    liquidationManager: (c.liquidationManager || "") as `0x${string}`,
    usdc: (c.usdc || "") as `0x${string}`,
  };
}

export function sepoliaContractsFromConfig(): SepoliaContractAddresses {
  const c = testnetConfig.source.contracts;
  return {
    collateralAdapter: (c.collateralAdapter || "") as `0x${string}`,
    slabFinanceCollectible: (c.slabFinanceCollectible || "") as `0x${string}`,
  };
}
