import type { PrismaClient } from "@prisma/client";
import {
  COLLATERAL_REGISTRY_ABI,
  HEALTH_FACTOR_ENGINE_ABI,
  ORACLE_CONSUMER_ABI,
  ARC_TESTNET_CHAIN_ID,
  testnetConfig,
} from "@slabfinance/shared";
import { createWalletClient, defineChain, http, type Address, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PENDING = 0;

function hubChainDef(rpcUrl: string) {
  return defineChain({
    id: ARC_TESTNET_CHAIN_ID,
    name: testnetConfig.hub.name,
    nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: { default: { name: "ArcScan", url: testnetConfig.hub.blockExplorer } },
  });
}

/**
 * After a PENDING collateral row is indexed, push catalog price into OracleConsumer and
 * activate collateral (prefer `recomputePosition`; if ACL blocks HF engine, use DEFAULT_ADMIN + activateCollateral).
 */
export async function seedOraclePriceAndActivate(params: {
  prisma: PrismaClient;
  publicClient: PublicClient;
  hubRpcUrl: string;
  registry: Address;
  collateralId: `0x${string}`;
  oracle: Address;
  healthFactorEngine: Address;
  deployerPrivateKey: `0x${string}`;
  oracleFallbackPriceUsd8?: string;
  owner: Address;
  collection: Address;
  tokenId: bigint;
  collateralStatus: number;
}): Promise<void> {
  const {
    prisma,
    publicClient,
    hubRpcUrl,
    registry,
    collateralId,
    oracle,
    healthFactorEngine,
    deployerPrivateKey,
    oracleFallbackPriceUsd8,
    owner,
    collection,
    tokenId,
    collateralStatus,
  } = params;

  if (collateralStatus !== PENDING) return;

  const collectionLc = collection.toLowerCase();
  const card = await prisma.card.findUnique({
    where: {
      collection_tokenId: {
        collection: collectionLc,
        tokenId,
      },
    },
  });

  let price8: bigint | null = null;
  if (card?.latestPriceUsdc != null && card.latestPriceUsdc > 0n) {
    price8 = card.latestPriceUsdc * 100n;
  } else if (oracleFallbackPriceUsd8) {
    try {
      const v = BigInt(oracleFallbackPriceUsd8);
      if (v > 0n) price8 = v;
    } catch {
      /* ignore */
    }
  }

  if (price8 == null) {
    console.warn(
      `[indexer] PENDING collateral ${collectionLc} #${tokenId}: no Card.latestPriceUsdc and no INDEXER_ORACLE_FALLBACK_PRICE_USD8 — skip setMockPrice`,
    );
    return;
  }

  let tier = card?.tier ?? 2;
  if (tier < 1 || tier > 3) tier = 2;

  const account = privateKeyToAccount(deployerPrivateKey);
  const chain = hubChainDef(hubRpcUrl);
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(hubRpcUrl),
  });

  try {
    const hashOracle = await walletClient.writeContract({
      address: oracle,
      abi: ORACLE_CONSUMER_ABI,
      functionName: "setMockPrice",
      args: [collection, tokenId, price8, tier],
    });
    await publicClient.waitForTransactionReceipt({ hash: hashOracle });
    console.log(
      `[indexer] setMockPrice ${collectionLc} #${tokenId} price8=${price8} tier=${tier} tx=${hashOracle}`,
    );
  } catch (e) {
    console.error(`[indexer] setMockPrice failed for ${collectionLc} #${tokenId}`, e);
    return;
  }

  try {
    const hashHf = await walletClient.writeContract({
      address: healthFactorEngine,
      abi: HEALTH_FACTOR_ENGINE_ABI,
      functionName: "recomputePosition",
      args: [owner],
    });
    await publicClient.waitForTransactionReceipt({ hash: hashHf });
    console.log(`[indexer] recomputePosition(${owner}) tx=${hashHf}`);
    return;
  } catch (e) {
    console.warn(
      `[indexer] recomputePosition failed for ${owner} (e.g. HF engine lacks registry role on-chain); trying DEFAULT_ADMIN activateCollateral`,
      e,
    );
  }

  try {
    const adminRole = await publicClient.readContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "DEFAULT_ADMIN_ROLE",
    });
    const isAdmin = await publicClient.readContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "hasRole",
      args: [adminRole, account.address],
    });
    if (!isAdmin) {
      console.error(
        "[indexer] deployer is not CollateralRegistry DEFAULT_ADMIN — cannot activateCollateral after recomputePosition failed",
      );
      return;
    }

    const hfRole = await publicClient.readContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "HF_ENGINE_ROLE",
    });
    const hadHfRole = await publicClient.readContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "hasRole",
      args: [hfRole, account.address],
    });

    if (!hadHfRole) {
      const hGrant = await walletClient.writeContract({
        address: registry,
        abi: COLLATERAL_REGISTRY_ABI,
        functionName: "grantRole",
        args: [hfRole, account.address],
      });
      await publicClient.waitForTransactionReceipt({ hash: hGrant });
    }

    const hAct = await walletClient.writeContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "activateCollateral",
      args: [collateralId],
    });
    await publicClient.waitForTransactionReceipt({ hash: hAct });
    console.log(`[indexer] activateCollateral(${collateralId}) tx=${hAct}`);

    if (!hadHfRole) {
      const hRevoke = await walletClient.writeContract({
        address: registry,
        abi: COLLATERAL_REGISTRY_ABI,
        functionName: "revokeRole",
        args: [hfRole, account.address],
      });
      await publicClient.waitForTransactionReceipt({ hash: hRevoke });
    }
  } catch (e2) {
    console.error(`[indexer] activateCollateral fallback failed for ${collateralId}`, e2);
  }
}
