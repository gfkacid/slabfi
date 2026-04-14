import type { Chain } from "viem";
import { hubProgramsFromConfig, protocolConfig } from "@slabfinance/shared";
import { slabHubPlaceholder } from "./chains";
import { hubContracts } from "./contracts";

/** When true, hub lending/collateral reads use Solana (not wagmi / Arc). */
export const HUB_IS_SOLANA = true;

/** Wagmi chain placeholder for UI copy; hub state is on Solana. */
export const hubChain: Chain = slabHubPlaceholder;

export const solanaHub = {
  rpcUrl: protocolConfig.hub.rpcUrl,
  programId: hubProgramsFromConfig().slabHub,
  usdcMint: protocolConfig.hub.usdcMint,
};

/** True when connected EVM chain is the (legacy) Arc-style hub; false while hub is Solana-only. */
export function isHubEvm(chainId: number | undefined): boolean {
  if (HUB_IS_SOLANA) return false;
  return chainId === hubChain.id;
}

export { hubContracts };
