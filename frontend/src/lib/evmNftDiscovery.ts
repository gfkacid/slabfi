import type { Address, PublicClient } from "viem";
import {
  ERC721_STANDARD_ABI,
  IERC721_ENUMERABLE_INTERFACE_ID,
  SLAB_COLLECTIBLE_ABI,
} from "@slabfinance/shared";
import { MAX_OWNER_SCAN_TOKEN_ID_DEFAULT, MAX_TOKEN_ID } from "@slabfinance/shared";

async function supportsEnumerable(client: PublicClient, collection: Address): Promise<boolean> {
  try {
    return await client.readContract({
      address: collection,
      abi: ERC721_STANDARD_ABI,
      functionName: "supportsInterface",
      args: [IERC721_ENUMERABLE_INTERFACE_ID],
    });
  } catch {
    return false;
  }
}

async function tokenIdsViaEnumerable(
  client: PublicClient,
  collection: Address,
  owner: Address,
): Promise<string[] | null> {
  const ok = await supportsEnumerable(client, collection);
  if (!ok) return null;
  try {
    const bal = await client.readContract({
      address: collection,
      abi: ERC721_STANDARD_ABI,
      functionName: "balanceOf",
      args: [owner],
    });
    const n = Number(bal);
    if (!Number.isFinite(n) || n <= 0) return [];
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const tid = await client.readContract({
        address: collection,
        abi: ERC721_STANDARD_ABI,
        functionName: "tokenOfOwnerByIndex",
        args: [owner, BigInt(i)],
      });
      out.push(tid.toString());
    }
    return out;
  } catch {
    return null;
  }
}

function ownerScanMax(): number {
  const raw = import.meta.env.VITE_EVM_LOCK_OWNER_SCAN_MAX;
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return Math.min(n, 50_000);
  return MAX_OWNER_SCAN_TOKEN_ID_DEFAULT;
}

async function tokenIdsViaOwnerScan(
  client: PublicClient,
  collection: Address,
  owner: Address,
): Promise<string[]> {
  const cap = ownerScanMax();
  const out: string[] = [];
  const lo = 1n;
  const hi = BigInt(cap);
  for (let id = lo; id <= hi; id++) {
    try {
      const o = await client.readContract({
        address: collection,
        abi: SLAB_COLLECTIBLE_ABI,
        functionName: "ownerOf",
        args: [id],
      });
      if (o.toLowerCase() === owner.toLowerCase()) out.push(id.toString());
    } catch {
      // missing token or RPC error
    }
  }
  return out;
}

/** Demo collections with dense low ids — keep small scan. */
async function tokenIdsViaDenseStubScan(
  client: PublicClient,
  collection: Address,
  owner: Address,
): Promise<string[]> {
  const out: string[] = [];
  for (let id = 1n; id <= BigInt(MAX_TOKEN_ID); id++) {
    try {
      const o = await client.readContract({
        address: collection,
        abi: SLAB_COLLECTIBLE_ABI,
        functionName: "ownerOf",
        args: [id],
      });
      if (o.toLowerCase() === owner.toLowerCase()) out.push(id.toString());
    } catch {
      /* skip */
    }
  }
  return out;
}

export type InventoryApiTokenIds = { tokenIds: string[] };

export async function fetchInventoryFromApi(
  chainId: number,
  wallet: Address,
): Promise<string[] | null> {
  const base = import.meta.env.VITE_API_BASE?.trim();
  if (!base) return null;
  try {
    const url = `${base.replace(/\/$/, "")}/inventory/evm/${chainId}/${wallet}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as InventoryApiTokenIds;
    if (!Array.isArray(data.tokenIds)) return null;
    return data.tokenIds.map(String);
  } catch {
    return null;
  }
}

/**
 * Resolves owned token ids for an ERC-721: API (if configured) → enumerable → owner scan.
 */
export async function discoverOwnedErc721TokenIds(
  client: PublicClient,
  collection: Address,
  owner: Address,
  chainId: number,
): Promise<string[]> {
  const api = await fetchInventoryFromApi(chainId, owner);
  if (api?.length) return api;

  const viaEnum = await tokenIdsViaEnumerable(client, collection, owner);
  if (viaEnum !== null) return viaEnum;

  const stub = await tokenIdsViaDenseStubScan(client, collection, owner);
  if (stub.length) return stub;

  return tokenIdsViaOwnerScan(client, collection, owner);
}
