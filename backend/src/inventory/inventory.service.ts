import { Injectable } from "@nestjs/common";
import { createPublicClient, http, type Address, type Chain, type PublicClient } from "viem";
import { base, polygon } from "viem/chains";
import {
  protocolConfig,
  SLAB_COLLECTIBLE_ABI,
  ERC721_STANDARD_ABI,
  IERC721_ENUMERABLE_INTERFACE_ID,
  MAX_OWNER_SCAN_TOKEN_ID_DEFAULT,
  MAX_TOKEN_ID,
} from "@slabfinance/shared";

function chainFor(chainId: number, rpcUrl: string): Chain {
  if (chainId === polygon.id) return { ...polygon, rpcUrls: { default: { http: [rpcUrl] } } };
  if (chainId === base.id) return { ...base, rpcUrls: { default: { http: [rpcUrl] } } };
  return {
    id: chainId,
    name: `chain-${chainId}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  };
}

function scanMax(): number {
  const raw = process.env.INVENTORY_OWNER_SCAN_MAX?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return Math.min(n, 50_000);
  return MAX_OWNER_SCAN_TOKEN_ID_DEFAULT;
}

@Injectable()
export class InventoryService {
  private client(chainId: number, rpcUrl: string): PublicClient {
    return createPublicClient({
      chain: chainFor(chainId, rpcUrl),
      transport: http(rpcUrl),
    });
  }

  /**
   * Lists ERC-721 token ids owned by `wallet` for the configured `collection` on `chainId`
   * (Polygon / Base). Same strategy as the frontend: enumerable → dense stub scan → owner scan.
   */
  async listOwnedTokenIds(chainId: number, collection: Address, wallet: Address): Promise<string[]> {
    const src = Object.values(protocolConfig.evmSources).find((s) => s.chainId === chainId);
    if (!src) return [];
    const rpc =
      process.env[`${src.id.toUpperCase()}_RPC_URL`]?.trim() || src.rpcUrl;
    const client = this.client(chainId, rpc);

    const enumerable = await client
      .readContract({
        address: collection,
        abi: ERC721_STANDARD_ABI,
        functionName: "supportsInterface",
        args: [IERC721_ENUMERABLE_INTERFACE_ID],
      })
      .catch(() => false);

    if (enumerable) {
      try {
        const bal = await client.readContract({
          address: collection,
          abi: ERC721_STANDARD_ABI,
          functionName: "balanceOf",
          args: [wallet],
        });
        const n = Number(bal);
        if (!Number.isFinite(n) || n <= 0) return [];
        const out: string[] = [];
        for (let i = 0; i < n; i++) {
          const tid = await client.readContract({
            address: collection,
            abi: ERC721_STANDARD_ABI,
            functionName: "tokenOfOwnerByIndex",
            args: [wallet, BigInt(i)],
          });
          out.push(tid.toString());
        }
        return out;
      } catch {
        /* fall through */
      }
    }

    const dense: string[] = [];
    for (let id = 1n; id <= BigInt(MAX_TOKEN_ID); id++) {
      try {
        const o = await client.readContract({
          address: collection,
          abi: SLAB_COLLECTIBLE_ABI,
          functionName: "ownerOf",
          args: [id],
        });
        if (o.toLowerCase() === wallet.toLowerCase()) dense.push(id.toString());
      } catch {
        /* skip */
      }
    }
    if (dense.length) return dense;

    const cap = scanMax();
    const out: string[] = [];
    for (let id = 1n; id <= BigInt(cap); id++) {
      try {
        const o = await client.readContract({
          address: collection,
          abi: SLAB_COLLECTIBLE_ABI,
          functionName: "ownerOf",
          args: [id],
        });
        if (o.toLowerCase() === wallet.toLowerCase()) out.push(id.toString());
      } catch {
        /* skip */
      }
    }
    return out;
  }
}
