import type { Address } from "viem";
import { hubContractsFromConfig, testnetConfig } from "@slabfinance/shared";

export function hubChainId(): string {
  return String(testnetConfig.hub.chainId);
}

export function hubRpcUrl(): string | undefined {
  return testnetConfig.hub.rpcUrl;
}

export function lendingPoolAddress(): Address | undefined {
  const a = hubContractsFromConfig().lendingPool;
  return a && a.length >= 10 ? a : undefined;
}

export function collateralRegistryAddress(): Address | undefined {
  const a = hubContractsFromConfig().collateralRegistry;
  return a && a.length >= 10 ? a : undefined;
}

export function healthFactorEngineAddress(): Address | undefined {
  const a = hubContractsFromConfig().healthFactorEngine;
  return a && a.length >= 10 ? a : undefined;
}
