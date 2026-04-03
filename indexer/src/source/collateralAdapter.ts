import type { PrismaClient } from "@prisma/client";
import type { DecodedEventLog } from "../utils/poller.js";

export async function handleCollateralAdapterDecoded(params: {
  prisma: PrismaClient;
  sourceChainId: string;
  decoded: DecodedEventLog[];
  blockTs: (bn: bigint) => Promise<bigint>;
}): Promise<void> {
  const { prisma, sourceChainId, decoded, blockTs } = params;

  for (const ev of decoded) {
    const bn = ev.blockNumber!;
    const ts = await blockTs(bn);
    const tx = ev.transactionHash!;
    const logIndex = ev.logIndex!;
    const args = ev.args as Record<string, unknown>;

    if (ev.eventName === "Locked") {
      const owner = String(args.owner).toLowerCase();
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "AdapterLocked" } },
        create: {
          sourceChainId,
          kind: "AdapterLocked",
          actor: owner,
          amount: args.tokenId as bigint,
          payloadJson: JSON.stringify({ ccipMessageId: args.ccipMessageId }),
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "Unlocked") {
      const recipient = String(args.recipient).toLowerCase();
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "AdapterUnlocked" } },
        create: {
          sourceChainId,
          kind: "AdapterUnlocked",
          actor: recipient,
          amount: args.tokenId as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }
  }
}
