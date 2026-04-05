/**
 * Writes OracleConsumer.setMockPrice on Arc for the borrower's first PENDING collateral.
 * No CollateralRegistry / LendingPool redeploy — only OracleConsumer (DEFAULT_ADMIN).
 *
 * Price resolution:
 * - If API_BASE is set: GET /collateral/by-owner/{borrower}, match collection + tokenId,
 *   use latestPriceUsd (8 decimals) or card.latestPriceUsdc × 100 → 8 decimals.
 * - Else: require PRICE_USD_8DEC (e.g. 7670000000 for $76.70).
 *
 *   API_BASE=http://localhost:3001 DEPLOYER_PRIVATE_KEY=0x… pnpm oracle:push-mock -- 0xBorrower
 *   PRICE_USD_8DEC=7670000000 ORACLE_TIER=2 DEPLOYER_PRIVATE_KEY=0x… pnpm oracle:push-mock -- 0xBorrower
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
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET_CHAIN_ID } from "../shared/constants/chains";
import { COLLATERAL_REGISTRY_ABI, ORACLE_CONSUMER_ABI } from "../shared/constants/abis";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const PENDING = 0;

type ApiCollateralRow = {
  collection: string;
  tokenId: string;
  latestPriceUsd?: string | null;
  card?: { latestPriceUsdc?: string | null; tier?: number } | null;
};

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((a) => a !== "--");
  const borrowerRaw = argv[0] ?? process.env.BORROWER_ADDRESS;
  if (!borrowerRaw || !isAddress(borrowerRaw)) {
    throw new Error("Usage: pnpm oracle:push-mock -- 0xBorrowerAddress");
  }
  const borrower = borrowerRaw as Address;

  const pk =
    process.env.DEPLOYER_PRIVATE_KEY?.trim() || process.env.ORACLE_ADMIN_PRIVATE_KEY?.trim();
  if (!pk?.startsWith("0x") || pk.length < 64) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY (OracleConsumer DEFAULT_ADMIN), or ORACLE_ADMIN_PRIVATE_KEY");
  }
  const account = privateKeyToAccount(pk as `0x${string}`);

  const rpc = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  const registry = testnetConfig.hub.contracts.collateralRegistry as Address;
  const oracle = testnetConfig.hub.contracts.oracleConsumer as Address;

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

  let pendingItem: { collection: Address; tokenId: bigint } | null = null;

  for (const cid of position.collateralIds) {
    const item = await publicClient.readContract({
      address: registry,
      abi: COLLATERAL_REGISTRY_ABI,
      functionName: "getCollateralItem",
      args: [cid],
    });
    if (Number(item.status) === PENDING) {
      pendingItem = { collection: item.collection, tokenId: item.tokenId };
      break;
    }
  }

  if (!pendingItem) {
    console.log("No PENDING collateral for this borrower — nothing to seed.");
    return;
  }

  const collection = pendingItem.collection;
  const tokenId = pendingItem.tokenId;

  const apiBase = process.env.API_BASE?.trim().replace(/\/$/, "");
  let price8: bigint;
  let tier = Number(process.env.ORACLE_TIER ?? "2");

  if (apiBase) {
    const url = `${apiBase}/collateral/by-owner/${encodeURIComponent(borrower)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API ${url}: ${res.status}`);
    }
    const list = (await res.json()) as ApiCollateralRow[];
    const match = list.find(
      (r) =>
        r.collection.toLowerCase() === collection.toLowerCase() && BigInt(r.tokenId) === tokenId,
    );
    if (!match) {
      throw new Error("API has no row matching this PENDING collateral; set PRICE_USD_8DEC or fix API data");
    }
    if (match.latestPriceUsd && BigInt(match.latestPriceUsd) > 0n) {
      price8 = BigInt(match.latestPriceUsd);
    } else if (match.card?.latestPriceUsdc) {
      price8 = BigInt(match.card.latestPriceUsdc) * 100n;
    } else {
      throw new Error("API row has no latestPriceUsd or card.latestPriceUsdc; set PRICE_USD_8DEC");
    }
    if (match.card?.tier != null && match.card.tier >= 1 && match.card.tier <= 3) {
      tier = match.card.tier;
    }
  } else {
    const raw = process.env.PRICE_USD_8DEC?.trim();
    if (!raw) {
      throw new Error("Set API_BASE or PRICE_USD_8DEC (USD with 8 decimals, e.g. 7670000000)");
    }
    price8 = BigInt(raw);
  }

  if (tier < 1 || tier > 3) {
    throw new Error("ORACLE_TIER / card.tier must be 1–3");
  }

  console.log(`setMockPrice collection=${collection} tokenId=${tokenId} priceUSD8=${price8} tier=${tier}`);

  const hash = await walletClient.writeContract({
    address: oracle,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "setMockPrice",
    args: [collection, tokenId, price8, tier],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Mined in block ${receipt.blockNumber}: ${hash}`);
  console.log("Next: click “Sync position on hub” in the app (or call recomputePosition), then refresh.");
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
