import type { HubContractAddresses, SepoliaContractAddresses } from "@slabfinance/shared";

const hubContractAddresses: HubContractAddresses = {
  lendingPool: (import.meta.env.VITE_LENDING_POOL_ADDRESS || "") as `0x${string}`,
  collateralRegistry: (import.meta.env.VITE_COLLATERAL_REGISTRY_ADDRESS || "") as `0x${string}`,
  oracleConsumer: (import.meta.env.VITE_ORACLE_CONSUMER_ADDRESS || "") as `0x${string}`,
  healthFactorEngine: (import.meta.env.VITE_HEALTH_FACTOR_ENGINE_ADDRESS || "") as `0x${string}`,
  liquidationManager: (import.meta.env.VITE_LIQUIDATION_MANAGER_ADDRESS || "") as `0x${string}`,
  usdc: (import.meta.env.VITE_USDC_ADDRESS || "") as `0x${string}`,
};

export const CONTRACT_ADDRESSES = {
  arc: hubContractAddresses,
  arbitrumSepolia: hubContractAddresses,
  sepolia: {
    collateralAdapter: (import.meta.env.VITE_COLLATERAL_ADAPTER_ADDRESS || "") as `0x${string}`,
    slabFinanceCollectible: (import.meta.env.VITE_SLAB_FINANCE_COLLECTIBLE_ADDRESS || "") as `0x${string}`,
  } satisfies SepoliaContractAddresses,
};
