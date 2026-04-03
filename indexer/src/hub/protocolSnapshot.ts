import type { PrismaClient } from "@prisma/client";
import type { Address, PublicClient } from "viem";
import { LENDING_POOL_READ_ABI } from "../utils/abis.js";

export async function writeProtocolSnapshot(params: {
  prisma: PrismaClient;
  client: PublicClient;
  hubChainId: string;
  pool: Address;
}): Promise<void> {
  const { prisma, client, hubChainId, pool } = params;

  const [
    totalAssets,
    totalBorrows,
    utilizationWad,
    borrowAprBps,
    supplyAprBps,
    exchangeRateWad,
    totalSupplyShares,
  ] = await Promise.all([
    client.readContract({ address: pool, abi: LENDING_POOL_READ_ABI, functionName: "totalAssets" }),
    client.readContract({ address: pool, abi: LENDING_POOL_READ_ABI, functionName: "totalBorrows" }),
    client.readContract({ address: pool, abi: LENDING_POOL_READ_ABI, functionName: "utilization" }),
    client.readContract({ address: pool, abi: LENDING_POOL_READ_ABI, functionName: "currentBorrowAPR" }),
    client.readContract({ address: pool, abi: LENDING_POOL_READ_ABI, functionName: "currentSupplyAPR" }),
    client.readContract({ address: pool, abi: LENDING_POOL_READ_ABI, functionName: "exchangeRate" }),
    client.readContract({ address: pool, abi: LENDING_POOL_READ_ABI, functionName: "totalSupplyShares" }),
  ]);

  const latestBlock = await client.getBlockNumber();
  const block = await client.getBlock({ blockNumber: latestBlock });
  const timestampUnix = block.timestamp;

  const depositorGroups = await prisma.lendingPoolEvent.groupBy({
    by: ["account"],
    where: { hubChainId, kind: "Deposited" },
  });
  const positionCount = await prisma.position.count({ where: { hubChainId } });

  await prisma.protocolSnapshot.create({
    data: {
      hubChainId,
      totalAssets,
      totalBorrows,
      utilizationWad,
      borrowAprBps,
      supplyAprBps,
      exchangeRateWad,
      blockNumber: latestBlock,
      timestampUnix,
      totalSupplyShares,
      depositorCount: depositorGroups.length,
      positionCount,
    },
  });
}
