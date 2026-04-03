import type { PrismaClient } from "@prisma/client";
import { COLLATERAL_REGISTRY_ABI } from "@slabfinance/shared";
import type { Address, PublicClient } from "viem";
import type { DecodedEventLog } from "../utils/poller.js";

export async function handleCollateralRegistryDecoded(params: {
  prisma: PrismaClient;
  client: PublicClient;
  hubChainId: string;
  registry: Address;
  decoded: DecodedEventLog[];
  blockTs: (bn: bigint) => Promise<bigint>;
}): Promise<void> {
  const { prisma, client, hubChainId, registry, decoded, blockTs } = params;

  for (const ev of decoded) {
    const bn = ev.blockNumber!;
    const ts = await blockTs(bn);
    const tx = ev.transactionHash!;
    const logIndex = ev.logIndex!;
    const args = ev.args as Record<string, unknown>;

    if (ev.eventName === "CollateralRegistered") {
      const id = String(args.id).toLowerCase() as `0x${string}`;
      const owner = String(args.owner).toLowerCase() as `0x${string}`;
      const item = await client.readContract({
        address: registry,
        abi: COLLATERAL_REGISTRY_ABI,
        functionName: "getCollateralItem",
        args: [id],
      });

      const rowId = String(item.id).toLowerCase() as `0x${string}`;

      await prisma.collateralItem.upsert({
        where: { id: rowId },
        create: {
          id: rowId,
          hubChainId,
          sourceChainId: BigInt(item.sourceChainId),
          collection: String(item.collection).toLowerCase(),
          tokenId: item.tokenId,
          owner: String(item.owner).toLowerCase(),
          status: item.status,
          lockedAtUnix: item.lockedAt,
        },
        update: {
          sourceChainId: BigInt(item.sourceChainId),
          collection: String(item.collection).toLowerCase(),
          tokenId: item.tokenId,
          owner: String(item.owner).toLowerCase(),
          status: item.status,
          lockedAtUnix: item.lockedAt,
        },
      });

      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "CollateralRegistered" } },
        create: {
          hubChainId,
          kind: "CollateralRegistered",
          actor: owner,
          counterparty: id,
          amount: BigInt(args.sourceChainId as bigint | number),
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "CollateralStatusChanged") {
      const id = String(args.id).toLowerCase() as `0x${string}`;
      const newStatus = Number(args.newStatus);
      await prisma.collateralItem.updateMany({
        where: { id, hubChainId },
        data: { status: newStatus },
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "CollateralStatusChanged" } },
        create: {
          hubChainId,
          kind: "CollateralStatusChanged",
          actor: id,
          amount: BigInt(newStatus),
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "UnlockInitiated") {
      const collateralId = String(args.collateralId).toLowerCase() as `0x${string}`;
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "UnlockInitiated" } },
        create: {
          hubChainId,
          kind: "UnlockInitiated",
          actor: collateralId,
          payloadJson: JSON.stringify({ ccipMessageId: args.ccipMessageId }),
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
