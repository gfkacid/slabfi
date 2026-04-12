import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { protocolConfig } from "@slabfinance/shared";
import type { SlabCollectible } from "@slabfinance/shared";
import { baseMainnet, evmAppChains, polygonMainnet } from "@/lib/chains";
import { contractsForChainId } from "@/lib/contracts";
import { discoverOwnedErc721TokenIds } from "@/lib/evmNftDiscovery";
import { loadEvmNftDisplay } from "@/lib/evmNftDisplay";

export type { SlabCollectible };

const configuredChainIds = new Set(evmAppChains.map((c) => c.id));

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

export function useSlabCollectibles() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({
    chainId: chainId as (typeof polygonMainnet)["id"] | (typeof baseMainnet)["id"],
  });
  const isSourceChain = configuredChainIds.has(
    chainId as (typeof polygonMainnet)["id"] | (typeof baseMainnet)["id"],
  );
  const collectionAddr = contractsForChainId(chainId)?.collection;
  const integ = integrationForChain(chainId);

  return useQuery({
    queryKey: ["slab-collectibles", address, chainId, collectionAddr],
    queryFn: async (): Promise<SlabCollectible[]> => {
      if (!address || !isSourceChain || !collectionAddr || !publicClient) return [];
      if (collectionAddr === "0x0000000000000000000000000000000000000000") return [];

      const tokenIds = await discoverOwnedErc721TokenIds(
        publicClient,
        collectionAddr as `0x${string}`,
        address as `0x${string}`,
        chainId,
      );

      const nfts: SlabCollectible[] = [];
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
    enabled: !!address && isSourceChain && !!collectionAddr && !!publicClient,
  });
}
