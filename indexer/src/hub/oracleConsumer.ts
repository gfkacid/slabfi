import type { PrismaClient } from "@prisma/client";
import type { DecodedEventLog } from "../utils/poller.js";

export async function handleOracleConsumerDecoded(params: {
  prisma: PrismaClient;
  hubChainId: string;
  decoded: DecodedEventLog[];
  blockTs: (bn: bigint) => Promise<bigint>;
}): Promise<void> {
  const { prisma, hubChainId, decoded, blockTs } = params;

  for (const ev of decoded) {
    const bn = ev.blockNumber!;
    const ts = await blockTs(bn);
    const tx = ev.transactionHash!;
    const logIndex = ev.logIndex!;
    const args = ev.args as Record<string, unknown>;
    const collection = String(args.collection).toLowerCase();
    const tokenId = args.tokenId as bigint;

    if (ev.eventName === "PriceUpdated") {
      const newPrice = args.newPrice as bigint;
      const attestedAt = args.attestedAt as bigint;
      await prisma.priceRecord.upsert({
        where: {
          hubChainId_txHash_logIndex: { hubChainId, txHash: tx, logIndex },
        },
        create: {
          hubChainId,
          collection,
          tokenId,
          priceUsd: newPrice,
          attestedAtUnix: attestedAt,
          updatedAtUnix: ts,
          txHash: tx,
          blockNumber: bn,
          logIndex,
        },
        update: {
          priceUsd: newPrice,
          attestedAtUnix: attestedAt,
          updatedAtUnix: ts,
        },
      });
      await prisma.collateralItem.updateMany({
        where: {
          hubChainId,
          collection,
          tokenId,
        },
        data: { latestPriceUsd: newPrice },
      });
    }
  }
}
