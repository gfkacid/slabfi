import type { PrismaClient } from "@prisma/client";
import type { DecodedEventLog } from "../utils/poller.js";

export async function handleNftVaultDecoded(params: {
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

    if (ev.eventName === "Deposited") {
      const owner = String(args.owner).toLowerCase();
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "VaultDeposited" } },
        create: {
          sourceChainId,
          kind: "VaultDeposited",
          actor: owner,
          counterparty: args.collateralId as string,
          amount: args.tokenId as bigint,
          payloadJson: JSON.stringify({ collection: args.collection }),
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "Released") {
      const recipient = String(args.recipient).toLowerCase();
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "VaultReleased" } },
        create: {
          sourceChainId,
          kind: "VaultReleased",
          actor: recipient,
          counterparty: args.collateralId as string,
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
