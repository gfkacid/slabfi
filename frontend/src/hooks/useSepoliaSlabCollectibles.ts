import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { sepolia } from "@/lib/chains";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { SLAB_COLLECTIBLE_ABI, MAX_TOKEN_ID } from "@slabfinance/shared";
import type { SlabCollectible } from "@slabfinance/shared";

export type SepoliaSlabNft = SlabCollectible & {
  setName?: string;
  cardNumber?: string;
  cardRarity?: string;
  cardPrinting?: string;
};

/**
 * Enumerates Slab.Finance demo NFTs on Ethereum Sepolia for the connected wallet,
 * regardless of the wallet's currently selected chain (uses a Sepolia public client).
 */
export function useSepoliaSlabCollectibles(enabled = true) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const collectionAddr = CONTRACT_ADDRESSES.sepolia.slabFinanceCollectible;

  return useQuery({
    queryKey: ["sepolia-slab-collectibles", address, collectionAddr],
    queryFn: async (): Promise<SepoliaSlabNft[]> => {
      if (!address || !publicClient || !collectionAddr) return [];

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
          // nonexistent tokenId or RPC error
        }
      }

      const nfts: SepoliaSlabNft[] = [];
      for (const tokenId of tokenIds) {
        try {
          const meta = await publicClient.readContract({
            address: collectionAddr,
            abi: SLAB_COLLECTIBLE_ABI,
            functionName: "cardMetadata",
            args: [BigInt(tokenId)],
          });
          if (meta) {
            const tierNum = Number(meta[8]);
            nfts.push({
              tokenId,
              name: meta[0] || `Token #${tokenId}`,
              image: meta[1] || undefined,
              collection: collectionAddr,
              setName: meta[2] || undefined,
              cardNumber: meta[3] || undefined,
              cardRarity: meta[4] || undefined,
              cardPrinting: meta[5] || undefined,
              riskTier: tierNum >= 1 && tierNum <= 3 ? tierNum : undefined,
            });
          } else {
            nfts.push({ tokenId, name: `Token #${tokenId}`, collection: collectionAddr });
          }
        } catch {
          nfts.push({ tokenId, name: `Token #${tokenId}`, collection: collectionAddr });
        }
      }

      return nfts;
    },
    enabled: enabled && !!address && !!publicClient && !!collectionAddr,
  });
}
