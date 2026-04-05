import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Address } from "viem";
import { testnetConfig } from "@slabfinance/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
// pnpm runs this package with cwd = indexer/; DATABASE_URL usually lives in repo root .env
loadEnv({ path: resolve(__dirname, "../../.env") });
loadEnv({ path: resolve(__dirname, "../.env") });

function reqAddr(v: string | undefined): Address | undefined {
  if (!v || v.length < 10) return undefined;
  return v as Address;
}

const hub = testnetConfig.hub.contracts;
const src = testnetConfig.source.contracts;

export const config = {
  hubRpcUrl: testnetConfig.hub.rpcUrl,
  sourceRpcUrl: testnetConfig.source.rpcUrl,
  pollMs: Number(process.env.INDEXER_POLL_INTERVAL_MS ?? "5000"),
  chunkSize: BigInt(process.env.INDEXER_LOG_CHUNK_SIZE ?? "2000"),
  hubChainId: String(testnetConfig.hub.chainId),
  sourceChainId: String(testnetConfig.source.chainId),

  lendingPool: reqAddr(hub.lendingPool),
  collateralRegistry: reqAddr(hub.collateralRegistry),
  healthFactorEngine: reqAddr(hub.healthFactorEngine),
  liquidationManager: reqAddr(hub.liquidationManager),
  oracleConsumer: reqAddr(hub.oracleConsumer),
  /**
   * Same as hub deployer — must be OracleConsumer `DEFAULT_ADMIN` to call `setMockPrice` after `CollateralRegistered` (PENDING).
   */
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY?.trim() || undefined,
  /** Optional 8-decimal USD (e.g. 100000000 = $1) when `Card.latestPriceUsdc` is missing */
  oracleFallbackPriceUsd8: process.env.INDEXER_ORACLE_FALLBACK_PRICE_USD8?.trim(),
  nftVault: reqAddr(src.nftVault),
  collateralAdapter: reqAddr(src.collateralAdapter),
  slabCollectible: reqAddr(src.slabFinanceCollectible),
};

export function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}
