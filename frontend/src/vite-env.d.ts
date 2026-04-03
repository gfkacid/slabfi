/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_HUB_NETWORK: string;
  readonly VITE_ARC_TESTNET_RPC_URL: string;
  readonly VITE_SEPOLIA_RPC_URL: string;
  readonly VITE_LENDING_POOL_ADDRESS: string;
  readonly VITE_COLLATERAL_REGISTRY_ADDRESS: string;
  readonly VITE_ORACLE_CONSUMER_ADDRESS: string;
  readonly VITE_HEALTH_FACTOR_ENGINE_ADDRESS: string;
  readonly VITE_LIQUIDATION_MANAGER_ADDRESS: string;
  readonly VITE_USDC_ADDRESS: string;
  readonly VITE_COLLATERAL_ADAPTER_ADDRESS: string;
  readonly VITE_SLAB_FINANCE_COLLECTIBLE_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
