import { Connection } from "@solana/web3.js";
import type { Address } from "viem";
import { hubProgramsFromConfig, protocolConfig, SOLANA_HUB_CHAIN_ID } from "@slabfinance/shared";

export function hubChainId(): string {
  return SOLANA_HUB_CHAIN_ID;
}

export function hubRpcUrl(): string {
  return process.env.SOLANA_RPC_URL?.trim() || protocolConfig.hub.rpcUrl;
}

export function hubConnection(): Connection {
  return new Connection(hubRpcUrl(), "confirmed");
}

export function slabHubProgramId(): string {
  return process.env.SLAB_HUB_PROGRAM_ID?.trim() || hubProgramsFromConfig().slabHub;
}

/** @deprecated EVM hub registry; Solana hub uses program accounts instead. */
export function lendingPoolAddress(): Address | undefined {
  return undefined;
}

/** @deprecated */
export function collateralRegistryAddress(): Address | undefined {
  return undefined;
}

/** @deprecated */
export function healthFactorEngineAddress(): Address | undefined {
  return undefined;
}
