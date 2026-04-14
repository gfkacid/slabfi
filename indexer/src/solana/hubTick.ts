import { Connection, PublicKey } from "@solana/web3.js";
import type { PrismaClient } from "@prisma/client";
import { SOLANA_HUB_CHAIN_ID } from "@slabfinance/shared";
import { config } from "../config.js";
import { setCursor } from "../utils/poller.js";
import {
  decodeCompiledInstructionData,
  tryDecodeReceiveCrossChainLock,
} from "./decodeReceiveCrossChainLock.js";

const CURSOR_KEY = "hub:solana:slab_hub";

type ParsedIx = {
  programId: string;
  data: string;
};

function isParsedIx(x: unknown): x is ParsedIx {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.programId === "string" && typeof o.data === "string";
}

/**
 * Poll recent hub program signatures; decode `receive_cross_chain_lock` and upsert `CollateralItem` rows.
 */
export async function solanaHubTick(prisma: PrismaClient): Promise<void> {
  const id = config.slabHubProgramId;
  if (!id) return;

  const conn = new Connection(config.hubRpcUrl, "confirmed");
  const programPk = new PublicKey(id);
  const sigs = await conn.getSignaturesForAddress(programPk, { limit: 25 });
  const slot = sigs.length ? BigInt(sigs[0]!.slot ?? 0) : 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));

  for (const s of sigs) {
    if (!s.signature || s.err) continue;
    const parsed = await conn.getParsedTransaction(s.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!parsed || parsed.meta?.err) continue;

    const msg = parsed.transaction?.message;
    if (!msg || !("instructions" in msg)) continue;
    const ixs = msg.instructions as unknown[];
    for (const raw of ixs) {
      if (!isParsedIx(raw)) continue;
      if (raw.programId !== programPk.toBase58()) continue;
      let buf: Buffer;
      try {
        buf = decodeCompiledInstructionData(raw.data);
      } catch {
        continue;
      }
      const dec = tryDecodeReceiveCrossChainLock(buf);
      if (!dec) continue;

      const idRow = dec.collateralIdHex.toLowerCase() as `0x${string}`;
      const blockTs = parsed.blockTime != null ? BigInt(parsed.blockTime) : now;
      await prisma.collateralItem.upsert({
        where: { id: idRow },
        create: {
          id: idRow,
          hubChainId: SOLANA_HUB_CHAIN_ID,
          sourceChainId: String(dec.sourceChainSelector),
          collection: dec.collectionHex.toLowerCase(),
          tokenId: dec.tokenId,
          owner: dec.syntheticOwnerBase58,
          status: 1,
          lockedAtUnix: blockTs,
        },
        update: {
          sourceChainId: String(dec.sourceChainSelector),
          collection: dec.collectionHex.toLowerCase(),
          tokenId: dec.tokenId,
          owner: dec.syntheticOwnerBase58,
          status: 1,
          lockedAtUnix: blockTs,
        },
      });
    }
  }

  await setCursor(prisma, config.hubChainId, CURSOR_KEY, slot, now);
}
