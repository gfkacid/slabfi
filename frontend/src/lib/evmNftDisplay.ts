import type { Address, PublicClient } from "viem";
import { SLAB_COLLECTIBLE_ABI } from "@slabfinance/shared";
import type { EvmLockNft } from "@/hooks/useEvmLockCollectibles";
import { parseTokenUriJson, resolveTokenUri } from "@/lib/evmNftMetadata";

export async function loadEvmNftDisplay(
  client: PublicClient,
  collection: Address,
  tokenId: string,
): Promise<Omit<EvmLockNft, "chainId" | "integrationId" | "integrationLabel">> {
  try {
    const meta = await client.readContract({
      address: collection,
      abi: SLAB_COLLECTIBLE_ABI,
      functionName: "cardMetadata",
      args: [BigInt(tokenId)],
    });
    if (meta) {
      const tierNum = Number(meta[8]);
      return {
        tokenId,
        name: meta[0] || `Token #${tokenId}`,
        image: meta[1] || undefined,
        collection,
        setName: meta[2] || undefined,
        cardNumber: meta[3] || undefined,
        cardRarity: meta[4] || undefined,
        cardPrinting: meta[5] || undefined,
        riskTier: tierNum >= 1 && tierNum <= 3 ? tierNum : undefined,
      };
    }
  } catch {
    /* not CardFiCollectible */
  }

  let name = `Token #${tokenId}`;
  let image: string | undefined;
  try {
    const uri = await client.readContract({
      address: collection,
      abi: SLAB_COLLECTIBLE_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });
    if (uri) {
      const resolved = resolveTokenUri(uri);
      if (resolved.startsWith("http") || resolved.startsWith("data:")) {
        const res = await fetch(resolved);
        if (res.ok) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/json") || resolved.startsWith("data:application/json")) {
            const parsed = parseTokenUriJson(await res.text());
            if (parsed) {
              name = parsed.name ?? parsed.title ?? name;
              if (parsed.image) image = resolveTokenUri(parsed.image);
            }
          }
        }
      } else {
        const parsed = parseTokenUriJson(resolved);
        if (parsed) {
          name = parsed.name ?? parsed.title ?? name;
          if (parsed.image) image = resolveTokenUri(parsed.image);
        }
      }
    }
  } catch {
    /* tokenURI missing */
  }

  return { tokenId, name, image, collection };
}
