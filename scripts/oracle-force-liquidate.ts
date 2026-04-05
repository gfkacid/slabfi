/**
 * Demo / ops: lower OracleConsumer mock price, then HealthFactorEngine.recomputePosition(borrower)
 * so auctions queue when HF < 1 WAD.
 *
 * Requires DEPLOYER_PRIVATE_KEY or ORACLE_ADMIN_PRIVATE_KEY (OracleConsumer DEFAULT_ADMIN).
 *
 *   # All ACTIVE collaterals (use with multiple NFTs). --crash defaults to $1 (8 dec) so auction weights stay non-zero.
 *   DEPLOYER_PRIVATE_KEY=0x… pnpm oracle:force-liquidate -- --all --crash 0xBorrower
 *
 *   # Single collateral at COLLATERAL_INDEX (default 0)
 *   DEPLOYER_PRIVATE_KEY=0x… pnpm oracle:force-liquidate -- --crash 0xBorrower
 *
 * One-time if recompute reverts AccessControl: pnpm hub:grant-hf-liquidation
 * Optional: PRICE_USD_8DEC, CRASH_PRICE_USD8, COLLATERAL_INDEX, ORACLE_TIER, ARC_TESTNET_RPC
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  isAddress,
  keccak256,
  encodePacked,
  type Address,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET_CHAIN_ID } from "../shared/constants/chains";
import {
  COLLATERAL_REGISTRY_ABI,
  HEALTH_FACTOR_ENGINE_ABI,
  LENDING_POOL_ABI,
  ORACLE_CONSUMER_ABI,
} from "../shared/constants/abis";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const STATUS_ACTIVE = 1;
const POSITION_LIQUIDATABLE = 2;
const MIN_LIQUIDATION_UNITS = 50n;
const HF_WAD = 10n ** 18n;

function parseArgs(): { borrower: Address; crash: boolean; collateralIndex: number; allActive: boolean } {
  const raw = process.argv.slice(2).filter((a) => a !== "--");
  const crash = raw.some((a) => a === "--crash" || a === "-c");
  const allActive = raw.some((a) => a === "--all" || a === "-a");
  const pos = raw.filter(
    (a) => a !== "--crash" && a !== "-c" && a !== "--all" && a !== "-a",
  );
  const borrowerRaw = pos.find((a) => isAddress(a)) ?? process.env.BORROWER_ADDRESS;
  if (!borrowerRaw || !isAddress(borrowerRaw)) {
    throw new Error(
      "Usage: pnpm oracle:force-liquidate -- [--all] [--crash] 0xBorrower\n" +
        "  --all  set mock price on every ACTIVE collateral (use with multiple NFTs)\n" +
        "Or set BORROWER_ADDRESS. Without --all, use COLLATERAL_INDEX (default 0).",
    );
  }
  const idxRaw = process.env.COLLATERAL_INDEX?.trim() ?? "0";
  const collateralIndex = Number(idxRaw);
  if (!Number.isFinite(collateralIndex) || collateralIndex < 0) {
    throw new Error("COLLATERAL_INDEX must be a non-negative integer");
  }
  return { borrower: borrowerRaw as Address, crash, collateralIndex, allActive };
}

async function readHealthFactorWad(
  publicClient: PublicClient,
  healthFactorEngine: Address,
  borrower: Address,
): Promise<bigint | null> {
  try {
    return await publicClient.readContract({
      address: healthFactorEngine,
      abi: HEALTH_FACTOR_ENGINE_ABI,
      functionName: "getHealthFactor",
      args: [borrower],
    });
  } catch {
    return null;
  }
}

async function resolveTier(
  publicClient: PublicClient,
  oracle: Address,
  collection: Address,
  tokenId: bigint,
): Promise<number> {
  let tier = Number(process.env.ORACLE_TIER ?? "0");
  if (tier >= 1 && tier <= 3) return tier;
  const onChainTier = await publicClient.readContract({
    address: oracle,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "tokenTier",
    args: [collection, tokenId],
  });
  return onChainTier >= 1 && onChainTier <= 3 ? Number(onChainTier) : 2;
}

async function main(): Promise<void> {
  const { borrower, crash, collateralIndex, allActive } = parseArgs();

  const pk =
    process.env.DEPLOYER_PRIVATE_KEY?.trim() || process.env.ORACLE_ADMIN_PRIVATE_KEY?.trim();
  if (!pk?.startsWith("0x") || pk.length < 64) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY or ORACLE_ADMIN_PRIVATE_KEY (OracleConsumer admin)");
  }
  const account = privateKeyToAccount(pk as `0x${string}`);

  const rpc = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  const registry = testnetConfig.hub.contracts.collateralRegistry as Address;
  const oracle = testnetConfig.hub.contracts.oracleConsumer as Address;
  const healthFactorEngine = testnetConfig.hub.contracts.healthFactorEngine as Address;
  const lendingPool = testnetConfig.hub.contracts.lendingPool as Address;

  const hubChain = defineChain({
    id: ARC_TESTNET_CHAIN_ID,
    name: testnetConfig.hub.name,
    nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
    rpcUrls: { default: { http: [rpc] } },
    blockExplorers: { default: { name: "ArcScan", url: testnetConfig.hub.blockExplorer } },
  });

  const publicClient = createPublicClient({ chain: hubChain, transport: http(rpc) });
  const walletClient = createWalletClient({ account, chain: hubChain, transport: http(rpc) });

  const position = await publicClient.readContract({
    address: registry,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "getPosition",
    args: [borrower],
  });

  if (position.borrower === "0x0000000000000000000000000000000000000000") {
    throw new Error("No hub position for this borrower");
  }

  const ids = position.collateralIds;
  if (ids.length === 0) {
    throw new Error("Position has no collateral ids");
  }

  if (!allActive && collateralIndex >= ids.length) {
    throw new Error(`COLLATERAL_INDEX=${collateralIndex} out of range (position has ${ids.length} item(s))`);
  }

  const debt = await publicClient.readContract({
    address: lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: "outstandingDebt",
    args: [borrower],
  });
  const totalDebt = debt[2];
  const usdcDecimals = 6;
  const minDebt = MIN_LIQUIDATION_UNITS * 10n ** BigInt(usdcDecimals);
  if (totalDebt < minDebt) {
    throw new Error(
      `Outstanding debt ${totalDebt} is below hub minimum for liquidation (${minDebt} raw units ≈ 50 USDC).`,
    );
  }

  let price8: bigint;
  if (crash) {
    const rawCrash = process.env.CRASH_PRICE_USD8?.trim();
    price8 = rawCrash ? BigInt(rawCrash) : 100_000_000n;
    if (price8 === 0n) throw new Error("CRASH_PRICE_USD8 must be > 0");
  } else {
    const raw = process.env.PRICE_USD_8DEC?.trim();
    if (!raw) {
      throw new Error("Set PRICE_USD_8DEC (8-decimal USD) or pass --crash ($1 default via CRASH_PRICE_USD8)");
    }
    price8 = BigInt(raw);
    if (price8 === 0n) {
      throw new Error("PRICE_USD_8DEC must be > 0");
    }
  }

  type Target = { collateralId: `0x${string}`; collection: Address; tokenId: bigint; tier: number };
  const targets: Target[] = [];

  if (allActive) {
    for (const cid of ids) {
      const it = await publicClient.readContract({
        address: registry,
        abi: COLLATERAL_REGISTRY_ABI,
        functionName: "getCollateralItem",
        args: [cid],
      });
      if (Number(it.status) !== STATUS_ACTIVE) continue;
      const tier = await resolveTier(publicClient, oracle, it.collection, it.tokenId);
      targets.push({
        collateralId: cid,
        collection: it.collection,
        tokenId: it.tokenId,
        tier,
      });
    }
    if (targets.length === 0) {
      throw new Error("No ACTIVE collateral in position; use oracle:push-mock / reseed-pending for PENDING.");
    }
  } else {
    const collateralId = ids[collateralIndex]!;
    const item = await publicClient.readContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "getCollateralItem",
      args: [collateralId],
    });
    if (Number(item.status) !== STATUS_ACTIVE) {
      throw new Error(
        `Collateral at index ${collateralIndex} is not ACTIVE (status=${item.status}). ` +
          `Use --all after activating all, or oracle:push-mock for PENDING.`,
      );
    }
    const tier = await resolveTier(publicClient, oracle, item.collection, item.tokenId);
    targets.push({
      collateralId,
      collection: item.collection,
      tokenId: item.tokenId,
      tier,
    });
  }

  const hfBefore = await readHealthFactorWad(publicClient, healthFactorEngine, borrower);
  console.log(`Borrower=${borrower}`);
  console.log(
    allActive
      ? `--all: crashing ${targets.length} ACTIVE collateral row(s)`
      : `Collateral index=${collateralIndex} id=${targets[0]!.collateralId}`,
  );
  if (hfBefore !== null) {
    console.log(`HF before (WAD)=${hfBefore}`);
  } else {
    console.warn(
      "[warn] getHealthFactor reverted before updates. If this persists, upgrade hub OracleConsumer (sigma cap fix) or fix oracle state.",
    );
  }

  for (const t of targets) {
    console.log(
      `setMockPrice collection=${t.collection} tokenId=${t.tokenId} priceUSD8=${price8} tier=${t.tier}`,
    );
    const hashOracle = await walletClient.writeContract({
      address: oracle,
      abi: ORACLE_CONSUMER_ABI,
      functionName: "setMockPrice",
      args: [t.collection, t.tokenId, price8, t.tier],
    });
    const recO = await publicClient.waitForTransactionReceipt({ hash: hashOracle });
    console.log(`  mined block=${recO.blockNumber} tx=${hashOracle}`);
  }

  const hfAfterPrice = await readHealthFactorWad(publicClient, healthFactorEngine, borrower);
  if (hfAfterPrice !== null) {
    console.log(`HF after price (view, WAD)=${hfAfterPrice}`);
    if (hfAfterPrice >= HF_WAD) {
      console.warn(
        "[warn] HF is still >= 1.0 — add --all, lower PRICE_USD_8DEC, or ensure every ACTIVE NFT is priced down.",
      );
    }
  } else {
    console.warn("[warn] getHealthFactor reverted after setMockPrice; continuing with recomputePosition…");
  }

  const hashHf = await walletClient.writeContract({
    address: healthFactorEngine,
    abi: HEALTH_FACTOR_ENGINE_ABI,
    functionName: "recomputePosition",
    args: [borrower],
  });
  const recH = await publicClient.waitForTransactionReceipt({ hash: hashHf });
  console.log(`recomputePosition mined block=${recH.blockNumber} tx=${hashHf}`);

  let status: number;
  let hfFinal: bigint | null;
  try {
    status = Number(
      await publicClient.readContract({
        address: healthFactorEngine,
        abi: HEALTH_FACTOR_ENGINE_ABI,
        functionName: "getPositionStatus",
        args: [borrower],
      }),
    );
  } catch {
    status = -1;
  }
  hfFinal = await readHealthFactorWad(publicClient, healthFactorEngine, borrower);

  console.log(`Position status (enum uint8)=${status} (LIQUIDATABLE=${POSITION_LIQUIDATABLE})`);
  if (hfFinal !== null) console.log(`HF final (WAD)=${hfFinal}`);

  for (const t of targets) {
    const auctionId = keccak256(encodePacked(["address", "bytes32"], [borrower, t.collateralId]));
    console.log(`Expected auctionId collateral=${t.collateralId.slice(0, 10)}… → ${auctionId}`);
  }

  if (status === POSITION_LIQUIDATABLE) {
    console.log("Next: open /liquidations on the hub chain, bid with USDC, then claim after the deadline.");
  }
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
