import type { HubContractAddresses, SepoliaContractAddresses } from "../types/contracts";

/** Single source of truth for Arc Testnet (hub) + Ethereum Sepolia (source). Fill contract addresses after deploy. */
export const testnetConfig = {
  hub: {
    chainId: 5042002,
    name: "Arc Testnet",
    rpcUrl: "https://arc-testnet.drpc.org",
    blockExplorer: "https://testnet.arcscan.app",
    ccipRouter: "0xdE4E7FED43FAC37EB21aA0643d9852f75332eab8" as const,
    ccipChainSelector: "3034092155422581607",
    contracts: {
      // @slabfi-sync:hub-contracts-begin
      lendingPool: "0x1BaE68aCD54C18716678c6049b1919a30520F2F8",
      collateralRegistry: "0x96c990FAc3bA9329aEdbcf423C78e7880B6AB50e",
      oracleConsumer: "0x66A7737Fd2ac66c409E7D2fe896821DbA3dEc735",
      healthFactorEngine: "0xbE4a32F159Fe8e9E48aDEa1b70c6e16AFdcfb714",
      liquidationManager: "0x7691c741B6CB7F1C79BBc0f34bac0FF32f5A29eb",
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
      collateralAdapter: "0x68519cd40e0BA62EE6ABc9B5FE02e76e376C8A98",
      slabFinanceCollectible: "0x3E299E9762eE497C5aa8a34eD8260BaeB98B5f60",
      nftVault: "0x7a783706CA89603f0Cec64EFC801dA1aD20ad953",
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
