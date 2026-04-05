import type { PrismaClient } from "@prisma/client";
import { COLLATERAL_REGISTRY_ABI, HEALTH_FACTOR_ENGINE_ABI } from "@slabfinance/shared";
import type { Address, PublicClient } from "viem";
import type { DecodedEventLog } from "../utils/poller.js";

export async function handleLendingPoolDecoded(params: {
  prisma: PrismaClient;
  client: PublicClient;
  hubChainId: string;
  registry: Address;
  healthFactorEngine?: Address;
  decoded: DecodedEventLog[];
  blockTs: (bn: bigint) => Promise<bigint>;
}): Promise<void> {
  const { prisma, client, hubChainId, registry, healthFactorEngine, decoded, blockTs } = params;
  const borrowersToSync = new Set<string>();

  for (const ev of decoded) {
    const bn = ev.blockNumber!;
    const ts = await blockTs(bn);
    const tx = ev.transactionHash!;
    const logIndex = ev.logIndex!;
    const args = ev.args as Record<string, unknown>;

    if (ev.eventName === "Deposited") {
      const depositor = String(args.depositor).toLowerCase() as `0x${string}`;
      await prisma.lendingPoolEvent.upsert({
        where: { txHash_logIndex: { txHash: tx, logIndex } },
        create: {
          hubChainId,
          kind: "Deposited",
          account: depositor,
          amount: args.assets as bigint,
          amount2: args.sharesMinted as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "PoolDeposited" } },
        create: {
          hubChainId,
          kind: "PoolDeposited",
          actor: depositor,
          amount: args.assets as bigint,
          amount2: args.sharesMinted as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "Withdrawn") {
      const depositor = String(args.depositor).toLowerCase() as `0x${string}`;
      await prisma.lendingPoolEvent.upsert({
        where: { txHash_logIndex: { txHash: tx, logIndex } },
        create: {
          hubChainId,
          kind: "Withdrawn",
          account: depositor,
          amount: args.assets as bigint,
          amount2: args.sharesBurned as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "PoolWithdrawn" } },
        create: {
          hubChainId,
          kind: "PoolWithdrawn",
          actor: depositor,
          amount: args.assets as bigint,
          amount2: args.sharesBurned as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "Borrowed") {
      const borrower = String(args.borrower).toLowerCase() as `0x${string}`;
      borrowersToSync.add(borrower);
      await prisma.lendingPoolEvent.upsert({
        where: { txHash_logIndex: { txHash: tx, logIndex } },
        create: {
          hubChainId,
          kind: "Borrowed",
          account: borrower,
          amount: args.amount as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "Borrowed" } },
        create: {
          hubChainId,
          kind: "Borrowed",
          actor: borrower,
          amount: args.amount as bigint,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }

    if (ev.eventName === "Repaid") {
      const borrower = String(args.borrower).toLowerCase() as `0x${string}`;
      borrowersToSync.add(borrower);
      await prisma.lendingPoolEvent.upsert({
        where: { txHash_logIndex: { txHash: tx, logIndex } },
        create: {
          hubChainId,
          kind: "Repaid",
          account: borrower,
          amount: args.amount as bigint,
          boolFlag: args.fullyRepaid as boolean,
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
      await prisma.activityEvent.upsert({
        where: { txHash_logIndex_kind: { txHash: tx, logIndex, kind: "Repaid" } },
        create: {
          hubChainId,
          kind: "Repaid",
          actor: borrower,
          amount: args.amount as bigint,
          payloadJson: JSON.stringify({ fullyRepaid: args.fullyRepaid }),
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });
    }
  }

  for (const b of borrowersToSync) {
    const pos = await client.readContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "getPosition",
      args: [b as Address],
    });
    let healthFactorWad: bigint | null = null;
    if (healthFactorEngine) {
      try {
        healthFactorWad = await client.readContract({
          address: healthFactorEngine,
          abi: HEALTH_FACTOR_ENGINE_ABI,
          functionName: "getHealthFactor",
          args: [b as Address],
        });
      } catch {
        healthFactorWad = null;
      }
    }
    const hfPayload = healthFactorWad !== null ? { healthFactorWad } : {};
    await prisma.position.upsert({
      where: { borrower: b },
      create: {
        borrower: b,
        hubChainId,
        collateralIdsJson: JSON.stringify(pos.collateralIds),
        principal: pos.principal,
        interestAccrued: pos.interestAccrued,
        lastInterestUpdateUnix: pos.lastInterestUpdate,
        status: pos.status,
        ...hfPayload,
      },
      update: {
        collateralIdsJson: JSON.stringify(pos.collateralIds),
        principal: pos.principal,
        interestAccrued: pos.interestAccrued,
        lastInterestUpdateUnix: pos.lastInterestUpdate,
        status: pos.status,
        ...hfPayload,
      },
    });
  }
}
