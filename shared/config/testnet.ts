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
      // @slabfi-sync:hub-contracts-begin
      lendingPool: "",
      collateralRegistry: "",
      oracleConsumer: "",
      healthFactorEngine: "",
      liquidationManager: "",
      usdc: "0x3600000000000000000000000000000000000000",
      // @slabfi-sync:hub-contracts-end
    } satisfies Record<keyof HubContractAddresses, string>,
  },
  source: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59" as const,
    ccipChainSelector: "16015286601757825753",
    contracts: {
      // @slabfi-sync:source-contracts-begin
      collateralAdapter: "",
      slabFinanceCollectible: "",
      nftVault: "",
      // @slabfi-sync:source-contracts-end
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    },
  },
  cre: {
    /** Arc Testnet — MockKeystoneForwarder (fixed per network; not deployed by Foundry). https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts */
    forwarderAddress: "0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1" as const,
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
