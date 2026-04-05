import type { PrismaClient } from "@prisma/client";
import { COLLATERAL_REGISTRY_ABI } from "@slabfinance/shared";
import type { Address, PublicClient } from "viem";
import { seedOraclePriceAndActivate } from "./oracleMockSeed.js";
import type { DecodedEventLog } from "../utils/poller.js";

const COLLATERAL_PENDING = 0;

export async function handleCollateralRegistryDecoded(params: {
  prisma: PrismaClient;
  client: PublicClient;
  hubChainId: string;
  registry: Address;
  oracle?: Address;
  healthFactorEngine?: Address;
  deployerPrivateKey?: string;
  oracleFallbackPriceUsd8?: string;
  hubRpcUrl?: string;
  decoded: DecodedEventLog[];
  blockTs: (bn: bigint) => Promise<bigint>;
}): Promise<void> {
  const {
    prisma,
    client,
    hubChainId,
    registry,
    oracle,
    healthFactorEngine,
    deployerPrivateKey,
    oracleFallbackPriceUsd8,
    hubRpcUrl,
    decoded,
    blockTs,
  } = params;

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

      const sourceChainId = item.sourceChainId.toString();
      await prisma.collateralItem.upsert({
        where: { id: rowId },
        create: {
          id: rowId,
          hubChainId,
          sourceChainId,
          collection: String(item.collection).toLowerCase(),
          tokenId: item.tokenId,
          owner: String(item.owner).toLowerCase(),
          status: item.status,
          lockedAtUnix: item.lockedAt,
        },
        update: {
          sourceChainId,
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
          amount: null,
          payloadJson: JSON.stringify({
            sourceChainId: String(args.sourceChainId as bigint),
          }),
          txHash: tx,
          blockNumber: bn,
          logIndex,
          timestampUnix: ts,
        },
        update: {},
      });

      const statusNum = Number(item.status);
      if (
        statusNum === COLLATERAL_PENDING &&
        oracle &&
        healthFactorEngine &&
        hubRpcUrl &&
        deployerPrivateKey?.startsWith("0x")
      ) {
        await seedOraclePriceAndActivate({
          prisma,
          publicClient: client,
          hubRpcUrl,
          registry,
          collateralId: rowId,
          oracle,
          healthFactorEngine,
          deployerPrivateKey: deployerPrivateKey as `0x${string}`,
          oracleFallbackPriceUsd8,
          owner: String(item.owner).toLowerCase() as Address,
          collection: item.collection,
          tokenId: item.tokenId,
          collateralStatus: statusNum,
        });
      } else if (statusNum === COLLATERAL_PENDING && oracle && healthFactorEngine && hubRpcUrl) {
        console.warn(
          "[indexer] PENDING collateral: set DEPLOYER_PRIVATE_KEY (OracleConsumer DEFAULT_ADMIN) to auto-call setMockPrice + recomputePosition",
        );
      }
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
