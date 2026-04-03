import "dotenv/config";
import type { Address } from "viem";

function reqAddr(name: string, v: string | undefined): Address | undefined {
  if (!v || v.length < 10) return undefined;
  return v as Address;
}

export const config = {
  hubRpcUrl: process.env.INDEXER_HUB_RPC_URL ?? process.env.ARC_TESTNET_RPC ?? "",
  sourceRpcUrl: process.env.INDEXER_SOURCE_RPC_URL ?? process.env.SEPOLIA_RPC ?? "",
  pollMs: Number(process.env.INDEXER_POLL_INTERVAL_MS ?? "5000"),
  chunkSize: BigInt(process.env.INDEXER_LOG_CHUNK_SIZE ?? "2000"),
  hubChainId: process.env.INDEXER_HUB_CHAIN_ID ?? "5042002",
  sourceChainId: process.env.INDEXER_SOURCE_CHAIN_ID ?? "11155111",

  lendingPool: reqAddr("INDEXER_LENDING_POOL_ADDRESS", process.env.INDEXER_LENDING_POOL_ADDRESS),
  collateralRegistry: reqAddr(
    "INDEXER_COLLATERAL_REGISTRY_ADDRESS",
    process.env.INDEXER_COLLATERAL_REGISTRY_ADDRESS,
  ),
  liquidationManager: reqAddr(
    "INDEXER_LIQUIDATION_MANAGER_ADDRESS",
    process.env.INDEXER_LIQUIDATION_MANAGER_ADDRESS,
  ),
  oracleConsumer: reqAddr("INDEXER_ORACLE_CONSUMER_ADDRESS", process.env.INDEXER_ORACLE_CONSUMER_ADDRESS),
  nftVault: reqAddr("INDEXER_NFT_VAULT_ADDRESS", process.env.INDEXER_NFT_VAULT_ADDRESS),
  collateralAdapter: reqAddr(
    "INDEXER_COLLATERAL_ADAPTER_ADDRESS",
    process.env.INDEXER_COLLATERAL_ADAPTER_ADDRESS,
  ),
  slabCollectible: reqAddr(
    "INDEXER_SLAB_COLLECTIBLE_ADDRESS",
    process.env.INDEXER_SLAB_COLLECTIBLE_ADDRESS,
  ),
};

export function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}
