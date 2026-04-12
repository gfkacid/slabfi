import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Address } from "viem";
import { protocolConfig, SOLANA_HUB_CHAIN_ID } from "@slabfinance/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../.env") });
loadEnv({ path: resolve(__dirname, "../.env") });

function reqAddr(v: string | undefined): Address | undefined {
  if (!v || v.length < 10) return undefined;
  return v as Address;
}

function reqPubkey(v: string | undefined): string | undefined {
  const t = v?.trim();
  if (!t || t.length < 32) return undefined;
  return t;
}

const hubPrograms = protocolConfig.hub.programs;

/** RPC override env vars: `POLYGON_RPC_URL`, `BASE_RPC_URL`, … */
function rpcForSource(id: string, defaultUrl: string): string {
  const key = `${id.toUpperCase()}_RPC_URL`;
  const v = process.env[key]?.trim();
  return v || defaultUrl;
}

export type EvmIndexerSource = {
  id: string;
  chainId: string;
  rpcUrl: string;
  nftVault?: Address;
  collateralAdapter?: Address;
};

function buildEvmSources(): EvmIndexerSource[] {
  const out: EvmIndexerSource[] = [];
  for (const src of Object.values(protocolConfig.evmSources)) {
    const c = src.contracts;
    const vault = reqAddr(c.nftVault?.trim());
    const adapter = reqAddr(
      (c.collateralAdapterLayerZero || "").trim() || undefined,
    );
    if (!vault && !adapter) continue;
    out.push({
      id: src.id,
      chainId: String(src.chainId),
      rpcUrl: rpcForSource(src.id, src.rpcUrl),
      nftVault: vault,
      collateralAdapter: adapter,
    });
  }
  return out;
}

export const config = {
  hubRpcUrl: process.env.SOLANA_RPC_URL?.trim() || protocolConfig.hub.rpcUrl,
  pollMs: Number(process.env.INDEXER_POLL_INTERVAL_MS ?? "5000"),
  chunkSize: BigInt(process.env.INDEXER_LOG_CHUNK_SIZE ?? "2000"),
  hubChainId: SOLANA_HUB_CHAIN_ID,

  /** Solana hub program (Anchor `slab_hub`). */
  slabHubProgramId: reqPubkey(process.env.SLAB_HUB_PROGRAM_ID?.trim() || hubPrograms.slabHub),

  /** EVM chains with at least one deployed contract to poll. */
  evmSources: buildEvmSources(),

  lendingPool: undefined as Address | undefined,
  collateralRegistry: undefined as Address | undefined,
  healthFactorEngine: undefined as Address | undefined,
  liquidationManager: undefined as Address | undefined,
  oracleConsumer: undefined as Address | undefined,
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY?.trim() || undefined,
  oracleFallbackPriceUsd8: process.env.INDEXER_ORACLE_FALLBACK_PRICE_USD8?.trim(),
};

export function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}
