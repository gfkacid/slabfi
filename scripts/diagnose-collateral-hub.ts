/**
 * Checks whether a lock is visible on the hub CollateralRegistry (Arc) vs only on Sepolia.
 *
 * CollateralItem in the DB is filled from hub `CollateralRegistered` logs — not from Sepolia `Locked`.
 *
 *   pnpm diagnose:collateral -- 3
 *   TOKEN_ID=3 pnpm diagnose:collateral
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  encodePacked,
  http,
  keccak256,
  type Address,
} from "viem";
import { COLLATERAL_REGISTRY_ABI } from "../shared/constants/abis";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((a) => a !== "--");
  const tokenIdArg = argv[0] ?? process.env.TOKEN_ID ?? "3";
  const tokenId = BigInt(tokenIdArg);

  const hubRpc = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  const registry = testnetConfig.hub.contracts.collateralRegistry as Address;
  const collection = testnetConfig.source.contracts.slabFinanceCollectible as Address;
  const sepoliaSelector = BigInt(testnetConfig.source.ccipChainSelector);

  if (!registry || !collection) {
    throw new Error("collateralRegistry / slabFinanceCollectible missing in testnet config");
  }

  const collateralId = keccak256(
    encodePacked(["uint64", "address", "uint256"], [sepoliaSelector, collection, tokenId]),
  );

  const client = createPublicClient({ transport: http(hubRpc) });

  const item = await client.readContract({
    address: registry,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "getCollateralItem",
    args: [collateralId],
  });

  console.log(`collateralId (hub): ${collateralId}`);
  console.log(`tokenId: ${tokenId}, collection (Sepolia): ${collection}`);
  console.log("getCollateralItem:", item);

  if (item.lockedAt === 0n) {
    console.log(`
→ Hub registry has no row yet (lockedAt == 0).
  CCIP may still be in flight, failed, or the hub never received the message.
  Check CCIP Explorer for the ccipMessageId from the Sepolia Locked event.
  The indexer cannot create CollateralItem until this on-chain registration happens.`);
  } else {
    console.log(`
→ Hub already registered this collateral. If CollateralItem is still empty in MySQL:
  - Ensure the indexer is running with DATABASE_URL and can reach hub RPC.
  - Check IndexerCursor for chainId=${testnetConfig.hub.chainId} contractKey=hub:collateralRegistry
  - Watch indexer logs for tick errors (a thrown handler skips the rest of that tick).`);
  }
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
