import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { hubConnection } from "../lib/hub-config";
import { PrismaService } from "../prisma/prisma.service";
import { CardsService } from "../cards/cards.service";
import { loadKeypairFromEnv } from "../solana/keypair.util";
import {
  collateralIdEvmPacked,
  receiveCrossChainLockIx,
  sendVersionedTx,
  syntheticPubkeyFromEvmAddress,
} from "../solana/slab-hub";
import { SolanaOracleService } from "../oracle/solana-oracle.service";
import { priceUsdcToOracle8 } from "../cards/pricecharting";

type AdapterPayload = {
  ccipMessageId?: `0x${string}`;
  tokenId?: string;
  collection?: string;
  chainSelector?: string;
  relayed?: boolean;
  solanaSig?: string;
};

@Injectable()
export class CrossChainRelayService {
  private readonly log = new Logger(CrossChainRelayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cards: CardsService,
    private readonly oracle: SolanaOracleService,
  ) {}

  @Interval(Number(process.env.SOLANA_RELAYER_POLL_MS ?? "15000"))
  async relayPendingLocks(): Promise<void> {
    if (process.env.SOLANA_RELAYER_ENABLED?.trim() !== "true") return;

    const router = loadKeypairFromEnv("ROUTER_AUTHORITY_KEYPAIR");
    if (!router) {
      this.log.warn("ROUTER_AUTHORITY_KEYPAIR not set — relayer idle");
      return;
    }

    const rows = await this.prisma.activityEvent.findMany({
      where: { kind: "AdapterLocked" },
      orderBy: { timestampUnix: "asc" },
      take: 15,
    });

    const conn = hubConnection();

    for (const row of rows) {
      let payload: AdapterPayload;
      try {
        payload = JSON.parse(row.payloadJson || "{}") as AdapterPayload;
      } catch {
        continue;
      }
      if (payload.relayed) continue;
      if (!payload.collection || !payload.tokenId || !payload.chainSelector) continue;
      const msgId = payload.ccipMessageId;
      if (!msgId || msgId.length !== 66) continue;

      const chainSel = BigInt(payload.chainSelector);
      const collection = payload.collection.toLowerCase();
      const tokenId = BigInt(payload.tokenId);
      const owner = row.actor.toLowerCase();

      const collateralId = collateralIdEvmPacked(chainSel, collection, tokenId);
      const existing = await this.prisma.collateralItem.findUnique({
        where: { id: collateralId.toLowerCase() },
      });
      if (existing) {
        await this.mergePayload(row.txHash, row.logIndex, { ...payload, relayed: true });
        continue;
      }

      try {
        const receiveIx = receiveCrossChainLockIx({
          router: router.publicKey,
          payer: router.publicKey,
          sourceChainSelector: Number(chainSel),
          collection,
          tokenId,
          hubOwner: owner,
          messageDigest: msgId,
          collateralId,
        });
        const sig = await sendVersionedTx(conn, router, [router], [receiveIx]);
        this.log.log(`receive_cross_chain_lock ${sig} collateral=${collateralId}`);

        let priceUsd8d = 1_000_000_000n;
        let tier = 2;
        try {
          const v = await this.cards.getValuation(collection, String(tokenId));
          priceUsd8d = priceUsdcToOracle8(BigInt(Math.round(v.priceUSD)));
          tier = v.tier;
        } catch {
          const fb = process.env.ORACLE_FALLBACK_PRICE_USD8?.trim();
          if (fb) priceUsd8d = BigInt(fb);
        }

        const collectionMintPk = syntheticPubkeyFromEvmAddress(collection).toBase58();
        await this.oracle.pushPrice(collectionMintPk, tokenId, priceUsd8d, tier);

        await this.mergePayload(row.txHash, row.logIndex, {
          ...payload,
          relayed: true,
          solanaSig: sig,
        });
      } catch (e) {
        this.log.warn(`relay failed tx=${row.txHash} log=${row.logIndex}: ${String(e)}`);
      }
    }
  }

  private async mergePayload(txHash: string, logIndex: number, payload: AdapterPayload): Promise<void> {
    await this.prisma.activityEvent.update({
      where: { txHash_logIndex_kind: { txHash, logIndex, kind: "AdapterLocked" } },
      data: { payloadJson: JSON.stringify(payload) },
    });
  }
}
