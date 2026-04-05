/**
 * One-time ops: grant AuctionLiquidationManager.HF_ENGINE_ROLE to HealthFactorEngine
 * so recomputePosition can queue/cancel auctions.
 *
 *   DEPLOYER_PRIVATE_KEY=0x… pnpm hub:grant-hf-liquidation
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, defineChain, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET_CHAIN_ID } from "../shared/constants/chains";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const LM_ACL_ABI = [
  { inputs: [], name: "HF_ENGINE_ROLE", outputs: [{ type: "bytes32" }], stateMutability: "view", type: "function" },
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
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function main(): Promise<void> {
  const pk =
    process.env.DEPLOYER_PRIVATE_KEY?.trim() || process.env.ORACLE_ADMIN_PRIVATE_KEY?.trim();
  if (!pk?.startsWith("0x") || pk.length < 64) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY (LiquidationManager DEFAULT_ADMIN)");
  }
  const account = privateKeyToAccount(pk as `0x${string}`);

  const rpc = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  const lm = testnetConfig.hub.contracts.liquidationManager as Address;
  const hfEngine = testnetConfig.hub.contracts.healthFactorEngine as Address;

  const hubChain = defineChain({
    id: ARC_TESTNET_CHAIN_ID,
    name: testnetConfig.hub.name,
    nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
    rpcUrls: { default: { http: [rpc] } },
    blockExplorers: { default: { name: "ArcScan", url: testnetConfig.hub.blockExplorer } },
  });

  const publicClient = createPublicClient({ chain: hubChain, transport: http(rpc) });
  const walletClient = createWalletClient({ account, chain: hubChain, transport: http(rpc) });

  const role = await publicClient.readContract({
    address: lm,
    abi: LM_ACL_ABI,
    functionName: "HF_ENGINE_ROLE",
  });

  const has = await publicClient.readContract({
    address: lm,
    abi: LM_ACL_ABI,
    functionName: "hasRole",
    args: [role, hfEngine],
  });

  if (has) {
    console.log(`HealthFactorEngine already has HF_ENGINE_ROLE on LiquidationManager (${lm}).`);
    return;
  }

  console.log(`Granting HF_ENGINE_ROLE on ${lm} to HealthFactorEngine ${hfEngine}…`);
  const hash = await walletClient.writeContract({
    address: lm,
    abi: LM_ACL_ABI,
    functionName: "grantRole",
    args: [role, hfEngine],
  });
  const rec = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Mined block=${rec.blockNumber} tx=${hash}`);
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
