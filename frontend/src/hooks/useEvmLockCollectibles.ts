import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { protocolConfig } from "@slabfinance/shared";
import type { EvmLockNft } from "@slabfinance/shared";
import { contractsForChainId } from "@/lib/contracts";
import { discoverOwnedErc721TokenIds } from "@/lib/evmNftDiscovery";
import { loadEvmNftDisplay } from "@/lib/evmNftDisplay";

export type { EvmLockNft } from "@slabfinance/shared";

function integrationForChain(chainId: number): { id: string; label: string } | undefined {
  const entries = Object.entries(protocolConfig.integrations) as [
    string,
    { evmSourceId: keyof typeof protocolConfig.evmSources; label: string },
  ][];
  for (const [id, v] of entries) {
    const src = protocolConfig.evmSources[v.evmSourceId];
    if (src.chainId === chainId) return { id, label: v.label };
  }
  return undefined;
}

/**
 * Lists ERC-721 tokens the user owns in the configured `collection` for `chainId` (Polygon / Base).
 * Uses backend inventory API if `VITE_API_BASE` is set, else ERC721Enumerable, else `ownerOf` scan.
 */
export function useEvmLockCollectibles(chainId: number, enabled = true) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const collectionAddr = contractsForChainId(chainId)?.collection;
  const hasCollection = !!collectionAddr && collectionAddr !== "0x0000000000000000000000000000000000000000";
  const integ = integrationForChain(chainId);

  return useQuery({
    queryKey: ["evm-lock-collectibles", chainId, address, collectionAddr],
    queryFn: async (): Promise<EvmLockNft[]> => {
      if (!address || !publicClient || !collectionAddr || !hasCollection) return [];

      const tokenIds = await discoverOwnedErc721TokenIds(
        publicClient,
        collectionAddr as `0x${string}`,
        address as `0x${string}`,
        chainId,
      );

      const nfts: EvmLockNft[] = [];
      for (const tokenId of tokenIds) {
        const base = await loadEvmNftDisplay(publicClient, collectionAddr as `0x${string}`, tokenId);
        nfts.push({
          ...base,
          chainId,
          integrationId: integ?.id,
          integrationLabel: integ?.label,
        });
      }
      return nfts;
    },
    enabled: enabled && !!address && !!publicClient && hasCollection,
  });
}
