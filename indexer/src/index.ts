import { base, polygon } from "viem/chains";
import { createPublicClient, defineChain, http, type Abi, type Address, type Chain, type PublicClient } from "viem";
import { assertDatabaseUrl, config, type EvmIndexerSource } from "./config.js";
import { handleAuctionManagerDecoded } from "./hub/auctionManager.js";
import { handleCollateralRegistryDecoded } from "./hub/collateralRegistry.js";
import { handleLendingPoolDecoded } from "./hub/lendingPool.js";
import { handleOracleConsumerDecoded } from "./hub/oracleConsumer.js";
import { writeProtocolSnapshot } from "./hub/protocolSnapshot.js";
import { prisma } from "./prisma.js";
import { handleCollateralAdapterDecoded } from "./source/collateralAdapter.js";
import { handleNftVaultDecoded } from "./source/nftVault.js";
import { solanaHubTick } from "./solana/hubTick.js";
import {
  AUCTION_MANAGER_EVENTS_ABI,
  COLLATERAL_ADAPTER_EVENTS_ABI,
  COLLATERAL_REGISTRY_EVENTS_ABI,
  LENDING_POOL_EVENTS_ABI,
  NFT_VAULT_EVENTS_ABI,
  ORACLE_CONSUMER_EVENTS_ABI,
} from "./utils/abis.js";
import { fetchAndProcessRange } from "./utils/poller.js";

const toAbi = (x: readonly unknown[]) => x as unknown as Abi;

let shuttingDown = false;

async function hubTick(hubClient: PublicClient): Promise<void> {
  const chainId = config.hubChainId;
  const hubChainId = config.hubChainId;

  if (config.lendingPool && config.collateralRegistry) {
    await fetchAndProcessRange({
      prisma,
      client: hubClient,
      chainId,
      contractKey: "hub:lendingPool",
      address: config.lendingPool,
      abi: toAbi(LENDING_POOL_EVENTS_ABI),
      chunkSize: config.chunkSize,
      onDecoded: async ({ decoded, blockTs }) => {
        if (decoded.length === 0) return;
        await handleLendingPoolDecoded({
          prisma,
          client: hubClient,
          hubChainId,
          registry: config.collateralRegistry!,
          healthFactorEngine: config.healthFactorEngine,
          decoded,
          blockTs,
        });
      },
    });
  }

  if (config.collateralRegistry) {
    await fetchAndProcessRange({
      prisma,
      client: hubClient,
      chainId,
      contractKey: "hub:collateralRegistry",
      address: config.collateralRegistry,
      abi: toAbi(COLLATERAL_REGISTRY_EVENTS_ABI),
      chunkSize: config.chunkSize,
      onDecoded: async ({ decoded, blockTs }) => {
        if (decoded.length === 0) return;
        await handleCollateralRegistryDecoded({
          prisma,
          client: hubClient,
          hubChainId,
          registry: config.collateralRegistry!,
          decoded,
          blockTs,
        });
      },
    });
  }

  if (config.liquidationManager) {
    await fetchAndProcessRange({
      prisma,
      client: hubClient,
      chainId,
      contractKey: "hub:liquidationManager",
      address: config.liquidationManager,
      abi: toAbi(AUCTION_MANAGER_EVENTS_ABI),
      chunkSize: config.chunkSize,
      onDecoded: async ({ decoded, blockTs }) => {
        if (decoded.length === 0) return;
        await handleAuctionManagerDecoded({ prisma, hubChainId, decoded, blockTs });
      },
    });
  }

  if (config.oracleConsumer) {
    await fetchAndProcessRange({
      prisma,
      client: hubClient,
      chainId,
      contractKey: "hub:oracleConsumer",
      address: config.oracleConsumer,
      abi: toAbi(ORACLE_CONSUMER_EVENTS_ABI),
      chunkSize: config.chunkSize,
      onDecoded: async ({ decoded, blockTs }) => {
        if (decoded.length === 0) return;
        await handleOracleConsumerDecoded({ prisma, hubChainId, decoded, blockTs });
      },
    });
  }
}

function chainForIndexerSource(src: { id: string; chainId: string; rpcUrl: string }): Chain {
  const id = Number(src.chainId);
  if (id === polygon.id) return { ...polygon, rpcUrls: { default: { http: [src.rpcUrl] } } };
  if (id === base.id) return { ...base, rpcUrls: { default: { http: [src.rpcUrl] } } };
  return defineChain({
    id,
    name: src.id,
    nativeCurrency: { name: "Gas", symbol: "GAS", decimals: 18 },
    rpcUrls: { default: { http: [src.rpcUrl] } },
  });
}

async function sourceTickFor(src: EvmIndexerSource, client: PublicClient): Promise<void> {
  const chainId = src.chainId;
  const sourceChainId = src.chainId;
  const prefix = `source:${src.id}`;

  if (src.nftVault) {
    await fetchAndProcessRange({
      prisma,
      client,
      chainId,
      contractKey: `${prefix}:nftVault`,
      address: src.nftVault,
      abi: toAbi(NFT_VAULT_EVENTS_ABI),
      chunkSize: config.chunkSize,
      onDecoded: async ({ decoded, blockTs }) => {
        if (decoded.length === 0) return;
        await handleNftVaultDecoded({ prisma, sourceChainId, decoded, blockTs });
      },
    });
  }

  if (src.collateralAdapter) {
    await fetchAndProcessRange({
      prisma,
      client,
      chainId,
      contractKey: `${prefix}:collateralAdapter`,
      address: src.collateralAdapter,
      abi: toAbi(COLLATERAL_ADAPTER_EVENTS_ABI),
      chunkSize: config.chunkSize,
      onDecoded: async ({ decoded, blockTs }) => {
        if (decoded.length === 0) return;
        await handleCollateralAdapterDecoded({ prisma, client, sourceChainId, decoded, blockTs });
      },
    });
  }
}

async function maybeSnapshot(hubClient: PublicClient): Promise<void> {
  if (!config.lendingPool) return;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const recent = await prisma.protocolSnapshot.findFirst({
    where: {
      hubChainId: config.hubChainId,
      timestampUnix: { gte: now - 60n },
    },
  });
  if (recent) return;
  await writeProtocolSnapshot({
    prisma,
    client: hubClient,
    hubChainId: config.hubChainId,
    pool: config.lendingPool as Address,
  });
}

async function main(): Promise<void> {
  assertDatabaseUrl();

  if (!config.hubRpcUrl) {
    console.warn("[indexer] INDEXER_HUB_RPC_URL missing — hub polling skipped");
  }
  const hubClient: PublicClient | undefined = config.hubRpcUrl
    ? createPublicClient({ transport: http(config.hubRpcUrl) })
    : undefined;

  const evmClients = config.evmSources.map((src) => ({
    src,
    client: createPublicClient({
      chain: chainForIndexerSource(src),
      transport: http(src.rpcUrl),
    }),
  }));

  const loop = async () => {
    while (!shuttingDown) {
      try {
        if (config.slabHubProgramId) {
          await solanaHubTick(prisma);
        } else if (hubClient) {
          await hubTick(hubClient);
          await maybeSnapshot(hubClient);
        }
        for (const { src, client } of evmClients) {
          await sourceTickFor(src, client);
        }
      } catch (e) {
        console.error("[indexer] tick error", e);
      }
      await new Promise((r) => setTimeout(r, config.pollMs));
    }
  };

  void loop();

  const stop = async () => {
    shuttingDown = true;
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());

  console.log(
    config.slabHubProgramId
      ? "[indexer] running (Solana hub + EVM source poll)"
      : "[indexer] running (hub + source poll)",
  );
}

void main();
