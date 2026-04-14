/**
 * Finds the first block where each indexed contract has bytecode, then upserts `IndexerCursor`.
 *
 *   pnpm db:seed:indexer-cursors
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { protocolConfig } from "@slabfinance/shared";
import { base as baseChain, polygon as polygonChain } from "viem/chains";
import { createPublicClient, defineChain, getAddress, http, isAddress, type Address, type Chain, type PublicClient } from "viem";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

function reqAddr(v: string | undefined): Address | null {
  if (!v || v.length < 10) return null;
  if (!isAddress(v)) return null;
  return getAddress(v);
}

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

function chainForSource(src: (typeof protocolConfig.evmSources)["polygon"]): Chain {
  const id = src.chainId;
  if (id === polygonChain.id) return { ...polygonChain, rpcUrls: { default: { http: [src.rpcUrl] } } };
  if (id === baseChain.id) return { ...baseChain, rpcUrls: { default: { http: [src.rpcUrl] } } };
  return defineChain({
    id,
    name: src.id,
    nativeCurrency: { name: "Gas", symbol: "GAS", decimals: 18 },
    rpcUrls: { default: { http: [src.rpcUrl] } },
  });
}

function evmSourceSpecs(): CursorSpec[] {
  const out: CursorSpec[] = [];
  for (const src of Object.values(protocolConfig.evmSources)) {
    const id = String(src.chainId);
    const c = src.contracts;
    const vault = reqAddr(c.nftVault?.trim());
    const adapter = reqAddr(c.collateralAdapterLayerZero?.trim());
    const prefix = `source:${src.id}`;
    if (vault) out.push({ chainId: id, contractKey: `${prefix}:nftVault`, address: vault });
    if (adapter) out.push({ chainId: id, contractKey: `${prefix}:collateralAdapter`, address: adapter });
  }
  return out;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const list = evmSourceSpecs();
  if (list.length === 0) {
    throw new Error("No nftVault / collateralAdapter addresses in shared/config/protocol.ts (evmSources).");
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  const rows: { chainId: string; contractKey: string; lastBlock: bigint; deployBlock: bigint }[] = [];

  for (const spec of list) {
    const src = Object.values(protocolConfig.evmSources).find((s) => String(s.chainId) === spec.chainId);
    if (!src) continue;
    const client = createPublicClient({
      chain: chainForSource(src),
      transport: http(src.rpcUrl),
    });
    const deployBlock = await findFirstBytecodeBlock(client, spec.address);
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

  console.log(`[seed-indexer-cursors] upserted ${rows.length} IndexerCursor row(s) (EVM sources)`);
  console.log(
    "[seed-indexer-cursors] Solana hub uses slabHubProgramId — run indexer with SLAB_HUB_PROGRAM_ID set; cursors for Solana are updated by solanaHubTick.",
  );
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
