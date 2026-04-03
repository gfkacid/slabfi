import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { sepolia } from "@/lib/chains";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { SLAB_COLLECTIBLE_ABI, MAX_TOKEN_ID } from "@slabfinance/shared";
import type { SlabCollectible } from "@slabfinance/shared";

export type { SlabCollectible };

export function useSlabCollectibles() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const isSourceChain = chainId === sepolia.id;
  const collectionAddr = CONTRACT_ADDRESSES.sepolia.slabFinanceCollectible;

  return useQuery({
    queryKey: ["slab-collectibles", address, chainId, collectionAddr],
    queryFn: async (): Promise<SlabCollectible[]> => {
      if (!address || !isSourceChain || !collectionAddr || !publicClient) return [];

      const tokenIds: string[] = [];
      for (let id = 1; id <= MAX_TOKEN_ID; id++) {
        try {
          const owner = await publicClient.readContract({
            address: collectionAddr,
            abi: SLAB_COLLECTIBLE_ABI,
            functionName: "ownerOf",
            args: [BigInt(id)],
          });
          if (owner?.toLowerCase() === address.toLowerCase()) {
            tokenIds.push(String(id));
          }
        } catch {
          // Token doesn't exist or other error, skip
        }
      }

      const nfts: SlabCollectible[] = [];
      for (const tokenId of tokenIds) {
        try {
          const meta = await publicClient.readContract({
            address: collectionAddr,
            abi: SLAB_COLLECTIBLE_ABI,
            functionName: "cardMetadata",
            args: [BigInt(tokenId)],
          });
          if (meta) {
            nfts.push({
              tokenId,
              name: meta[0] || `Token #${tokenId}`,
              image: meta[1] || undefined,
              collection: collectionAddr,
            });
          } else {
            nfts.push({ tokenId, name: `Token #${tokenId}` });
          }
        } catch {
          nfts.push({ tokenId, name: `Token #${tokenId}` });
        }
      }

      return nfts;
    },
    enabled: !!address && isSourceChain && !!collectionAddr && !!publicClient,
  });
}
