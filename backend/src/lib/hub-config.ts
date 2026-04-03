import type { Address } from "viem";

export function hubChainId(): string {
  return process.env.BACKEND_HUB_CHAIN_ID ?? process.env.INDEXER_HUB_CHAIN_ID ?? "5042002";
}

export function hubRpcUrl(): string | undefined {
  return (
    process.env.BACKEND_HUB_RPC_URL ||
    process.env.INDEXER_HUB_RPC_URL ||
    process.env.ARC_TESTNET_RPC ||
    undefined
  );
}

export function lendingPoolAddress(): Address | undefined {
  const a = process.env.BACKEND_LENDING_POOL_ADDRESS || process.env.INDEXER_LENDING_POOL_ADDRESS;
  return a ? (a as Address) : undefined;
}

export function collateralRegistryAddress(): Address | undefined {
  const a =
    process.env.BACKEND_COLLATERAL_REGISTRY_ADDRESS ||
    process.env.INDEXER_COLLATERAL_REGISTRY_ADDRESS;
  return a ? (a as Address) : undefined;
}

export function healthFactorEngineAddress(): Address | undefined {
  const a =
    process.env.BACKEND_HEALTH_FACTOR_ENGINE_ADDRESS ||
    process.env.INDEXER_HEALTH_FACTOR_ENGINE_ADDRESS;
  return a ? (a as Address) : undefined;
}
