/**
 * Finds the first block where each indexed contract has bytecode (deployment block),
 * then upserts `IndexerCursor` so the next poll starts at that block (`lastBlock = deploy - 1`).
 *
 * Uses `testnetConfig` RPCs and addresses from `@slabfinance/shared` (same as the indexer).
 *
 *   pnpm db:seed:indexer-cursors
 *   # or: pnpm --filter @slabfinance/indexer exec tsx ../scripts/seed-indexer-cursors.ts
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { createPublicClient, getAddress, http, isAddress, type Address, type PublicClient } from "viem";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

function reqAddr(v: string | undefined): Address | null {
  if (!v || v.length < 10) return null;
  if (!isAddress(v)) return null;
  return getAddress(v);
}

/** Minimum block where `address` has non-empty runtime bytecode (proxy or implementation). */
async function findFirstBytecodeBlock(client: PublicClient, address: Address): Promise<bigint> {
  const latest = await client.getBlockNumber();
  const codeLatest = await client.getBytecode({ address });
  if (!codeLatest || codeLatest === "0x") {
    throw new Error(`No bytecode at ${address} (latest block ${latest})`);
  }

  let lo = 0n;
  let hi = latest;
  while (lo < hi) {
    const mid = (lo + hi) >> 1n;
    const code = await client.getBytecode({ address, blockNumber: mid });
    const hasCode = Boolean(code && code !== "0x" && code.length > 2);
    if (hasCode) hi = mid;
    else lo = mid + 1n;
  }
  return lo;
}

type CursorSpec = { chainId: string; contractKey: string; address: Address };

function hubSpecs(): CursorSpec[] {
  const id = String(testnetConfig.hub.chainId);
  const c = testnetConfig.hub.contracts;
  const out: CursorSpec[] = [];
  const lp = reqAddr(c.lendingPool);
  const reg = reqAddr(c.collateralRegistry);
  const liq = reqAddr(c.liquidationManager);
  const oracle = reqAddr(c.oracleConsumer);
  if (lp) out.push({ chainId: id, contractKey: "hub:lendingPool", address: lp });
  if (reg) out.push({ chainId: id, contractKey: "hub:collateralRegistry", address: reg });
  if (liq) out.push({ chainId: id, contractKey: "hub:liquidationManager", address: liq });
  if (oracle) out.push({ chainId: id, contractKey: "hub:oracleConsumer", address: oracle });
  return out;
}

function sourceSpecs(): CursorSpec[] {
  const id = String(testnetConfig.source.chainId);
  const c = testnetConfig.source.contracts;
  const out: CursorSpec[] = [];
  const vault = reqAddr(c.nftVault);
  const adapter = reqAddr(c.collateralAdapter);
  if (vault) out.push({ chainId: id, contractKey: "source:nftVault", address: vault });
  if (adapter) out.push({ chainId: id, contractKey: "source:collateralAdapter", address: adapter });
  return out;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const hubRpc = testnetConfig.hub.rpcUrl;
  const sourceRpc = testnetConfig.source.rpcUrl;
  if (!hubRpc || !sourceRpc) {
    throw new Error("testnetConfig hub/source rpcUrl is missing");
  }

  const hubClient = createPublicClient({ transport: http(hubRpc) });
  const sourceClient = createPublicClient({ transport: http(sourceRpc) });

  const hubList = hubSpecs();
  const sourceList = sourceSpecs();
  if (hubList.length === 0 && sourceList.length === 0) {
    throw new Error("No contract addresses configured in testnet.ts for indexer cursors");
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  const rows: { chainId: string; contractKey: string; lastBlock: bigint; deployBlock: bigint }[] = [];

  for (const spec of hubList) {
    const deployBlock = await findFirstBytecodeBlock(hubClient, spec.address);
    const lastBlock = deployBlock > 0n ? deployBlock - 1n : -1n;
    rows.push({ ...spec, lastBlock, deployBlock });
  }
  for (const spec of sourceList) {
    const deployBlock = await findFirstBytecodeBlock(sourceClient, spec.address);
    const lastBlock = deployBlock > 0n ? deployBlock - 1n : -1n;
    rows.push({ ...spec, lastBlock, deployBlock });
  }

  for (const r of rows) {
    await prisma.indexerCursor.upsert({
      where: { chainId_contractKey: { chainId: r.chainId, contractKey: r.contractKey } },
      create: {
        chainId: r.chainId,
        contractKey: r.contractKey,
        lastBlock: r.lastBlock,
        updatedAtUnix: now,
      },
      update: { lastBlock: r.lastBlock, updatedAtUnix: now },
    });
    console.log(
      `[seed-indexer-cursors] ${r.chainId} ${r.contractKey} deployBlock=${r.deployBlock} lastBlock=${r.lastBlock}`,
    );
  }

  console.log(`[seed-indexer-cursors] upserted ${rows.length} IndexerCursor row(s)`);
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
