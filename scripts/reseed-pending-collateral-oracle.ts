/**
 * One-shot: for hub collateral rows in DB, read on-chain `getCollateralItem`; if status is PENDING,
 * call `setMockPrice` + `recomputePosition` (same as indexer auto-seed).
 *
 *   DEPLOYER_PRIVATE_KEY=0x… pnpm oracle:reseed-pending
 *
 * Uses `Card.latestPriceUsdc×100` or `INDEXER_ORACLE_FALLBACK_PRICE_USD8`.
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { createPublicClient, http, type Address } from "viem";
import { COLLATERAL_REGISTRY_ABI } from "../shared/constants/abis";
import { testnetConfig } from "../shared/config/testnet";
import { seedOraclePriceAndActivate } from "../indexer/src/hub/oracleMockSeed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

async function main(): Promise<void> {
  const pk = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!pk?.startsWith("0x") || pk.length < 64) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY (OracleConsumer DEFAULT_ADMIN on Arc)");
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required");
  }

  const rpc = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  const hubChainId = String(testnetConfig.hub.chainId);
  const registryAddr = testnetConfig.hub.contracts.collateralRegistry as Address;
  const oracle = testnetConfig.hub.contracts.oracleConsumer as Address;
  const healthFactorEngine = testnetConfig.hub.contracts.healthFactorEngine as Address;

  const publicClient = createPublicClient({ transport: http(rpc) });
  const prisma = new PrismaClient();

  const rows = await prisma.collateralItem.findMany({
    where: { hubChainId },
    orderBy: { lockedAtUnix: "desc" },
    take: 50,
  });

  if (rows.length === 0) {
    console.log(`No collateral rows in DB for hubChainId=${hubChainId}.`);
    await prisma.$disconnect();
    return;
  }

  let seeded = 0;
  for (const row of rows) {
    const onChain = await publicClient.readContract({
      address: registryAddr,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "getCollateralItem",
      args: [row.id as `0x${string}`],
    });

    if (Number(onChain.status) !== 0) continue;

    console.log(`PENDING on-chain: id=${row.id} collection=${onChain.collection} tokenId=${onChain.tokenId}`);
    await seedOraclePriceAndActivate({
      prisma,
      publicClient,
      hubRpcUrl: rpc,
      registry: registryAddr,
      collateralId: row.id as `0x${string}`,
      oracle,
      healthFactorEngine,
      deployerPrivateKey: pk as `0x${string}`,
      oracleFallbackPriceUsd8: process.env.INDEXER_ORACLE_FALLBACK_PRICE_USD8?.trim(),
      owner: String(onChain.owner).toLowerCase() as Address,
      collection: onChain.collection,
      tokenId: onChain.tokenId,
      collateralStatus: 0,
    });
    seeded++;
  }

  console.log(seeded === 0 ? "No on-chain PENDING collateral among recent DB rows." : `Done. Seeded ${seeded} item(s).`);
  await prisma.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
