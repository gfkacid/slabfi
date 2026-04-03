import type { PrismaClient } from "@prisma/client";
import type { Abi, Address, Log, PublicClient } from "viem";
import { parseEventLogs } from "viem";

/** Decoded log row from `parseEventLogs` (narrowed for handlers). */
export type DecodedEventLog = {
  eventName: string;
  args: Record<string, unknown>;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
  address: `0x${string}`;
};

export async function getCursorLastBlock(
  prisma: PrismaClient,
  chainId: string,
  contractKey: string,
): Promise<bigint> {
  const row = await prisma.indexerCursor.findUnique({
    where: {
      chainId_contractKey: { chainId, contractKey },
    },
  });
  return row?.lastBlock ?? -1n;
}

export async function setCursor(
  prisma: PrismaClient,
  chainId: string,
  contractKey: string,
  lastBlock: bigint,
  updatedAtUnix: bigint,
): Promise<void> {
  await prisma.indexerCursor.upsert({
    where: { chainId_contractKey: { chainId, contractKey } },
    create: { chainId, contractKey, lastBlock, updatedAtUnix },
    update: { lastBlock, updatedAtUnix },
  });
}

export async function blockTimestamp(
  client: PublicClient,
  blockNumber: bigint,
  cache: Map<string, bigint>,
): Promise<bigint> {
  const k = blockNumber.toString();
  const hit = cache.get(k);
  if (hit !== undefined) return hit;
  const block = await client.getBlock({ blockNumber });
  const ts = block.timestamp;
  cache.set(k, ts);
  return ts;
}

export function decodeLogs(abi: Abi, logs: Log[]): DecodedEventLog[] {
  return parseEventLogs({ abi, logs, strict: false }) as DecodedEventLog[];
}

export async function fetchAndProcessRange(params: {
  prisma: PrismaClient;
  client: PublicClient;
  chainId: string;
  contractKey: string;
  address: Address;
  abi: Abi;
  chunkSize: bigint;
  onDecoded: (ctx: {
    decoded: DecodedEventLog[];
    blockTs: (bn: bigint) => Promise<bigint>;
  }) => Promise<void>;
}): Promise<void> {
  const { prisma, client, chainId, contractKey, address, abi, chunkSize, onDecoded } = params;

  const latest = await client.getBlockNumber();
  let last = await getCursorLastBlock(prisma, chainId, contractKey);
  let from = last + 1n;
  if (from > latest) return;

  const to = from + chunkSize - 1n > latest ? latest : from + chunkSize - 1n;

  const logs = await client.getLogs({
    address,
    fromBlock: from,
    toBlock: to,
  });

  const decoded = decodeLogs(abi, logs);
  const cache = new Map<string, bigint>();
  const blockTs = (bn: bigint) => blockTimestamp(client, bn, cache);

  await onDecoded({ decoded, blockTs });
  const now = BigInt(Math.floor(Date.now() / 1000));
  await setCursor(prisma, chainId, contractKey, to, now);
}
