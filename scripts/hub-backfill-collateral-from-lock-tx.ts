/**
 * Testnet recovery: emit the same `CollateralRegistered` the hub would produce after CCIP executes,
 * without waiting for Chainlink. Uses `DEFAULT_ADMIN` to temporarily grant `ROUTER_ROLE`, calls
 * `registerCollateral` with the real `ccipMessageId` from Sepolia `Locked` (replay protection),
 * then revokes the role. Future CCIP delivery for that messageId reverts with "Replay".
 *
 *   pnpm hub:backfill-collateral -- tx 0x<sepoliaLockTxHash>
 *   pnpm hub:backfill-collateral -- message-id 0x<bytes32>   # uses CCIP API payload for owner/token/collection
 *
 * Env: DEPLOYER_PRIVATE_KEY — must be `CollateralRegistry` `DEFAULT_ADMIN` on Arc.
 * Optional: ARC_TESTNET_RPC, SEPOLIA_RPC_URL
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  decodeAbiParameters,
  encodePacked,
  http,
  keccak256,
  parseAbiParameters,
  parseEventLogs,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { COLLATERAL_ADAPTER_ABI } from "../shared/constants/abis";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const REG_ABI = [
  {
    inputs: [],
    name: "ROUTER_ROLE",
    outputs: [{ type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { name: "sourceChainId", type: "uint64" },
      { name: "collection", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "ccipMessageId", type: "bytes32" },
    ],
    name: "registerCollateral",
    outputs: [{ name: "collateralId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "collateralId", type: "bytes32" }],
    name: "getCollateralItem",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "bytes32" },
          { name: "sourceChainId", type: "uint64" },
          { name: "collection", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "owner", type: "address" },
          { name: "lockedAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "bytes32" }],
    name: "processedMessages",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function lockArgsFromSepoliaTx(txHash: Hash): Promise<{
  ccipMessageId: Hash;
  tokenId: bigint;
  locker: Address;
}> {
  const rpc = process.env.SEPOLIA_RPC_URL?.trim() || testnetConfig.source.rpcUrl;
  const adapter = testnetConfig.source.contracts.collateralAdapter as Address;
  const client = createPublicClient({ transport: http(rpc) });
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  const logs = receipt.logs.filter((l) => l.address.toLowerCase() === adapter.toLowerCase());
  const parsed = parseEventLogs({ abi: COLLATERAL_ADAPTER_ABI, logs, eventName: "Locked", strict: false });
  const last = parsed[parsed.length - 1];
  if (!last?.args || typeof last.args !== "object") throw new Error("No Locked event in receipt");
  const a = last.args as { tokenId?: bigint; owner?: Address; ccipMessageId?: Hash };
  if (a.ccipMessageId == null || a.tokenId == null || !a.owner) throw new Error("Locked args incomplete");
  return { ccipMessageId: a.ccipMessageId, tokenId: a.tokenId, locker: a.owner };
}

async function decodePayloadFromCcipApi(messageId: Hash): Promise<{
  sourceChainId: bigint;
  collection: Address;
  tokenId: bigint;
  hubOwner: Address;
} | null> {
  const url = `https://api.ccip.chain.link/v2/messages/${messageId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = (await res.json()) as { data?: string };
  const data = j.data?.trim();
  if (!data || !data.startsWith("0x") || data.length < 10) return null;
  const decoded = decodeAbiParameters(parseAbiParameters("bytes4, uint64, address, uint256, address"), data as Hex);
  return {
    sourceChainId: decoded[1] as bigint,
    collection: decoded[2] as Address,
    tokenId: decoded[3] as bigint,
    hubOwner: decoded[4] as Address,
  };
}

function parseArgs(): { mode: "tx"; txHash: Hash } | { mode: "message"; messageId: Hash } {
  const raw = process.argv.slice(2).filter((a) => a !== "--");
  if (raw[0]?.toLowerCase() === "tx" && raw[1]?.startsWith("0x")) {
    return { mode: "tx", txHash: raw[1] as Hash };
  }
  if (raw[0]?.toLowerCase() === "message-id" && raw[1]?.startsWith("0x")) {
    return { mode: "message", messageId: raw[1] as Hash };
  }
  throw new Error(
    "Usage: pnpm hub:backfill-collateral -- tx 0x<sepoliaTx>\n" +
      "       pnpm hub:backfill-collateral -- message-id 0x<messageId>",
  );
}

async function main(): Promise<void> {
  const parsed = parseArgs();
  const hubRpc = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  const registry = testnetConfig.hub.contracts.collateralRegistry as Address;
  const pkRaw = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!pkRaw) throw new Error("DEPLOYER_PRIVATE_KEY required (registry DEFAULT_ADMIN on Arc).");
  const pk = (pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`) as Hex;
  const account = privateKeyToAccount(pk);

  let ccipMessageId: Hash;
  let sourceChainId: bigint;
  let collection: Address;
  let tokenId: bigint;
  let hubOwner: Address;

  if (parsed.mode === "tx") {
    const lock = await lockArgsFromSepoliaTx(parsed.txHash);
    ccipMessageId = lock.ccipMessageId;
    const fromApi = await decodePayloadFromCcipApi(ccipMessageId);
    if (fromApi) {
      sourceChainId = fromApi.sourceChainId;
      collection = fromApi.collection;
      tokenId = fromApi.tokenId;
      hubOwner = fromApi.hubOwner;
      console.log("[hub-backfill-collateral] decoded hub payload from CCIP API");
    } else {
      sourceChainId = BigInt(testnetConfig.source.ccipChainSelector);
      collection = testnetConfig.source.contracts.slabFinanceCollectible as Address;
      tokenId = lock.tokenId;
      hubOwner = lock.locker;
      console.log(
        "[hub-backfill-collateral] CCIP API payload missing — using Locked locker as hub owner + config collection",
      );
    }
  } else {
    ccipMessageId = parsed.messageId;
    const fromApi = await decodePayloadFromCcipApi(ccipMessageId);
    if (!fromApi) throw new Error("Could not fetch/decode CCIP API payload for message-id");
    sourceChainId = fromApi.sourceChainId;
    collection = fromApi.collection;
    tokenId = fromApi.tokenId;
    hubOwner = fromApi.hubOwner;
  }

  const publicClient = createPublicClient({ transport: http(hubRpc) });
  const walletClient = createWalletClient({
    account,
    chain: {
      id: testnetConfig.hub.chainId,
      name: testnetConfig.hub.name,
      nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
      rpcUrls: { default: { http: [hubRpc] } },
    },
    transport: http(hubRpc),
  });

  const processed = await publicClient.readContract({
    address: registry,
    abi: REG_ABI,
    functionName: "processedMessages",
    args: [ccipMessageId],
  });
  if (processed) {
    console.log("[hub-backfill-collateral] ccipMessageId already processed on hub — nothing to do.");
    return;
  }

  const collateralId = keccak256(
    encodePacked(["uint64", "address", "uint256"], [sourceChainId, collection, tokenId]),
  );

  {
    const item = await publicClient.readContract({
      address: registry,
      abi: REG_ABI,
      functionName: "getCollateralItem",
      args: [collateralId],
    });
    if (item.lockedAt > 0n) {
      console.log("[hub-backfill-collateral] collateral already registered (lockedAt > 0).");
      return;
    }
  }

  const routerRole = await publicClient.readContract({
    address: registry,
    abi: REG_ABI,
    functionName: "ROUTER_ROLE",
  });

  const hadRouter = await publicClient.readContract({
    address: registry,
    abi: REG_ABI,
    functionName: "hasRole",
    args: [routerRole, account.address],
  });

  console.log("[hub-backfill-collateral] registry", registry);
  console.log("[hub-backfill-collateral] sourceChainId", sourceChainId.toString());
  console.log("[hub-backfill-collateral] collection", collection);
  console.log("[hub-backfill-collateral] tokenId", tokenId.toString());
  console.log("[hub-backfill-collateral] hubOwner", hubOwner);
  console.log("[hub-backfill-collateral] ccipMessageId", ccipMessageId);

  if (!hadRouter) {
    const grantHash = await walletClient.writeContract({
      address: registry,
      abi: REG_ABI,
      functionName: "grantRole",
      args: [routerRole, account.address],
    });
    await publicClient.waitForTransactionReceipt({ hash: grantHash });
    console.log("[hub-backfill-collateral] granted ROUTER_ROLE", grantHash);
  }

  try {
    const regHash = await walletClient.writeContract({
      address: registry,
      abi: REG_ABI,
      functionName: "registerCollateral",
      args: [sourceChainId, collection, tokenId, hubOwner, ccipMessageId],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: regHash });
    console.log("[hub-backfill-collateral] registerCollateral tx", regHash);
    console.log("[hub-backfill-collateral] block", receipt.blockNumber.toString());
  } finally {
    if (!hadRouter) {
      await new Promise((r) => setTimeout(r, 1500));
      const block = await publicClient.getBlock({ blockTag: "latest" });
      const base = block.baseFeePerGas ?? 0n;
      const mults = [2n, 3n, 4n] as const;
      const prioSteps = [2_000_000_000n, 4_000_000_000n, 8_000_000_000n] as const;
      let lastErr: unknown;
      for (let i = 0; i < mults.length; i++) {
        try {
          const maxPriorityFeePerGas = prioSteps[i]!;
          const maxFeePerGas =
            (base > 0n ? base * mults[i]! : 80_000_000_000n) + maxPriorityFeePerGas;
          const revHash = await walletClient.writeContract({
            address: registry,
            abi: REG_ABI,
            functionName: "revokeRole",
            args: [routerRole, account.address],
            maxFeePerGas,
            maxPriorityFeePerGas,
          });
          await publicClient.waitForTransactionReceipt({ hash: revHash });
          console.log("[hub-backfill-collateral] revoked ROUTER_ROLE", revHash);
          lastErr = undefined;
          break;
        } catch (e) {
          lastErr = e;
          if (i < mults.length - 1) await new Promise((r) => setTimeout(r, 2500));
        }
      }
      if (lastErr) throw lastErr;
    }
  }

  console.log(
    "[hub-backfill-collateral] done — indexer should ingest `CollateralRegistered` on next hub poll.",
  );
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
