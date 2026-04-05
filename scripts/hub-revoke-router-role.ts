/**
 * One-shot: revoke deployer's temporary ROUTER_ROLE on CollateralRegistry (e.g. after a failed backfill revoke).
 *
 *   pnpm hub:revoke-router-role
 *
 * Env: DEPLOYER_PRIVATE_KEY, optional ARC_TESTNET_RPC
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const REG_ABI = [
  { name: "ROUTER_ROLE", type: "function", stateMutability: "pure", inputs: [], outputs: [{ type: "bytes32" }] },
  {
    name: "hasRole",
    type: "function",
    stateMutability: "view",
    inputs: [
      { type: "bytes32", name: "role" },
      { type: "address", name: "account" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "revokeRole",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "bytes32", name: "role" },
      { type: "address", name: "account" },
    ],
    outputs: [],
  },
] as const;

async function main(): Promise<void> {
  const pkRaw = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!pkRaw) throw new Error("DEPLOYER_PRIVATE_KEY required");
  const pk = (pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`) as Hex;
  const account = privateKeyToAccount(pk);
  const rpc = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  const registry = testnetConfig.hub.contracts.collateralRegistry as `0x${string}`;

  const publicClient = createPublicClient({ transport: http(rpc) });
  const walletClient = createWalletClient({
    account,
    chain: {
      id: testnetConfig.hub.chainId,
      name: testnetConfig.hub.name,
      nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
      rpcUrls: { default: { http: [rpc] } },
    },
    transport: http(rpc),
  });

  const routerRole = await publicClient.readContract({
    address: registry,
    abi: REG_ABI,
    functionName: "ROUTER_ROLE",
  });
  const has = await publicClient.readContract({
    address: registry,
    abi: REG_ABI,
    functionName: "hasRole",
    args: [routerRole, account.address],
  });
  if (!has) {
    console.log("[hub-revoke-router-role] deployer does not have ROUTER_ROLE — ok");
    return;
  }
  const block = await publicClient.getBlock({ blockTag: "latest" });
  const base = block.baseFeePerGas ?? 0n;
  const maxPriorityFeePerGas = 3_000_000_000n;
  const maxFeePerGas = (base * 2n > 0n ? base * 2n : 50_000_000_000n) + maxPriorityFeePerGas;
  const hash = await walletClient.writeContract({
    address: registry,
    abi: REG_ABI,
    functionName: "revokeRole",
    args: [routerRole, account.address],
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("[hub-revoke-router-role] revoked", hash);
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
