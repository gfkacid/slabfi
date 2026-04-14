import type { HubContractAddresses } from "@slabfinance/shared";
import { hubContractsFromConfig, protocolConfig } from "@slabfinance/shared";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

export const hubContracts: HubContractAddresses = hubContractsFromConfig();

/** Per EIP-155 `chainId` — adapter + ERC-721 collection used for locking. */
export const CONTRACT_ADDRESSES_BY_CHAIN: Record<
  string,
  { collateralAdapter: `0x${string}`; collection: `0x${string}` }
> = Object.fromEntries(
  Object.values(protocolConfig.evmSources).map((s) => {
    const adapter = (s.contracts.collateralAdapterLayerZero || "").trim() || ZERO;
    const collection = (s.contracts.collection || "").trim() || ZERO;
    return [
      String(s.chainId),
      {
        collateralAdapter: adapter as `0x${string}`,
        collection: collection as `0x${string}`,
      },
    ];
  }),
);

export function contractsForChainId(chainId: number | undefined) {
  if (chainId === undefined) return undefined;
  return CONTRACT_ADDRESSES_BY_CHAIN[String(chainId)];
}
