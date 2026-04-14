/**
 * Whitelist Courtyard (Polygon) and Beezie (Base) synthetic collection PDAs on the Solana `slab_hub` program.
 *
 *   HUB_ADMIN_KEYPAIR='[...]' pnpm exec tsx scripts/whitelist-evm-collections-solana.ts
 *
 * Uses `SOLANA_RPC_URL` when set (otherwise `protocolConfig.hub.rpcUrl`).
 */
import { readFileSync, existsSync } from "node:fs";
import { Keypair, Connection } from "@solana/web3.js";
import { protocolConfig } from "@slabfinance/shared";
import {
  sendVersionedTx,
  syntheticPubkeyFromEvmAddress,
  whitelistCollectionIx,
} from "../backend/src/solana/slab-hub";

function loadKeypair(): Keypair {
  const raw = process.env.HUB_ADMIN_KEYPAIR?.trim();
  if (!raw) throw new Error("HUB_ADMIN_KEYPAIR is required (JSON array or path to keypair JSON)");
  if (raw.startsWith("[")) {
    const arr = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  if (!existsSync(raw)) throw new Error(`Keypair file not found: ${raw}`);
  const arr = JSON.parse(readFileSync(raw, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

async function main(): Promise<void> {
  const admin = loadKeypair();
  const rpc = process.env.SOLANA_RPC_URL?.trim() || protocolConfig.hub.rpcUrl;
  const conn = new Connection(rpc, "confirmed");

  const targets = [
    protocolConfig.integrations.courtyard.referenceErc721,
    protocolConfig.integrations.beezie.referenceErc721,
  ] as const;

  for (const addr of targets) {
    const mint = syntheticPubkeyFromEvmAddress(addr);
    const ix = whitelistCollectionIx({
      admin: admin.publicKey,
      collectionMint: mint,
      kind: 1,
    });
    try {
      const sig = await sendVersionedTx(conn, admin, [admin], [ix]);
      console.log(`whitelist_collection ${addr} -> ${sig}`);
    } catch (e) {
      console.warn(`skip or retry ${addr}:`, String(e));
    }
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
