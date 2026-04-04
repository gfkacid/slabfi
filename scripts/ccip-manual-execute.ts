/**
 * Permissionless CCIP **execution** on the **destination chain** (Arc testnet) using Chainlink's SDK.
 *
 * Important:
 * - **Commit** (Merkle root on the destination CommitStore) is performed by the CCIP DON — you cannot
 *   “commit” yourself. If Atlas shows `commitTransactionHash: null`, wait or use CCIP support; this script
 *   will fail with a transient “commit not found” class error until then.
 * - **Manual execution** is for when the message is already committed but automatic `ccipReceive` failed,
 *   hit rate limits, or the smart-execution window expired — same flow as “Trigger Manual Execution” in
 *   https://ccip.chain.link
 *
 * Env:
 *   DEPLOYER_PRIVATE_KEY or CCIP_MANUAL_EXEC_PRIVATE_KEY — pays **Arc** gas (native USDC on Arc per chain config).
 *   ARC_TESTNET_RPC — optional; defaults to shared testnet hub RPC.
 *   CCIP_MANUAL_EXEC_GAS_LIMIT — optional override for receiver execution gas (e.g. 500000).
 *
 * Usage:
 *   pnpm ccip:manual-exec -- 0x<messageId>
 *   pnpm ccip:manual-exec -- 0x<messageId> --gas-limit 500000
 */
import { CCIPError, EVMChain } from "@chainlink/ccip-sdk";
import { viemWallet } from "@chainlink/ccip-sdk/viem";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createWalletClient, defineChain, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

function parseArgs(): { messageId: Hex; gasLimit?: number } {
  const raw = process.argv.slice(2).filter((a) => a !== "--");
  let gasLimit: number | undefined;
  const rest: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "--gas-limit" && raw[i + 1]) {
      gasLimit = Number.parseInt(raw[i + 1]!, 10);
      if (!Number.isFinite(gasLimit) || gasLimit <= 0) {
        throw new Error(`Invalid --gas-limit: ${raw[i + 1]}`);
      }
      i++;
      continue;
    }
    rest.push(raw[i]!);
  }
  const mid = rest[0];
  if (!mid?.startsWith("0x") || mid.length !== 66) {
    throw new Error(
      "Usage: pnpm ccip:manual-exec -- 0x<messageId> [--gas-limit <n>]\n" +
        "Message ID: 32-byte hex from Locked event or `pnpm diagnose:ccip -- tx <sepoliaTxHash>`.",
    );
  }
  return { messageId: mid as Hex, gasLimit };
}

async function main(): Promise<void> {
  const { messageId, gasLimit } = parseArgs();

  const pkRaw = process.env.CCIP_MANUAL_EXEC_PRIVATE_KEY?.trim() || process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!pkRaw) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY or CCIP_MANUAL_EXEC_PRIVATE_KEY (Arc-funded wallet).");
  }
  const pk = (pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`) as Hex;
  const account = privateKeyToAccount(pk);

  const rpcUrl = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  if (!rpcUrl) throw new Error("No Arc RPC (ARC_TESTNET_RPC or testnet hub rpcUrl).");

  const chain = defineChain({
    id: testnetConfig.hub.chainId,
    name: testnetConfig.hub.name,
    nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: {
      default: { name: "ArcScan", url: testnetConfig.hub.blockExplorer },
    },
  });

  const transport = http(rpcUrl, { timeout: 120_000, retryCount: 2 });
  const walletClient = createWalletClient({ account, chain, transport });
  const wallet = viemWallet(walletClient);

  const envGas = process.env.CCIP_MANUAL_EXEC_GAS_LIMIT?.trim();
  const gasFromEnv = envGas ? Number.parseInt(envGas, 10) : undefined;
  const effectiveGas =
    gasLimit ?? (Number.isFinite(gasFromEnv!) && gasFromEnv! > 0 ? gasFromEnv : undefined);

  console.log(`[ccip-manual-exec] destination ${testnetConfig.hub.name} (${chain.id})`);
  console.log(`[ccip-manual-exec] signer ${account.address}`);
  console.log(`[ccip-manual-exec] messageId ${messageId}`);

  const dest = await EVMChain.fromUrl(rpcUrl);

  try {
    const exec = await dest.execute({
      messageId,
      wallet,
      ...(effectiveGas ? { gasLimit: effectiveGas } : {}),
    });
    console.log("[ccip-manual-exec] execution tx:", exec.log.transactionHash);
    console.log("[ccip-manual-exec] block:", exec.log.blockNumber?.toString() ?? "?");
  } catch (e) {
    if (CCIPError.isCCIPError(e)) {
      console.error(`[ccip-manual-exec] ${e.code}: ${e.message}`);
      if (e.isTransient) {
        console.error(
          "[ccip-manual-exec] Transient (e.g. not committed yet) — wait for DON commit, then retry.",
        );
      }
      if (e.recovery) console.error("[ccip-manual-exec] Recovery:", e.recovery);
    }
    throw e;
  }
}

void main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
