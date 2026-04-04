/**
 * Looks up a CCIP lock message in Chainlink Atlas (commit / execute on destination).
 *
 * Usage:
 *   pnpm diagnose:ccip -- 0x<messageId>
 *   pnpm diagnose:ccip -- tx 0x<sepoliaTxHash>
 *
 * If `commitTransactionHash` and `receiptTransactionHash` are null, the hub has not
 * run `registerCollateral` yet — CollateralItem stays empty until CCIP executes on Arc.
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http, parseEventLogs, type Hash } from "viem";
import { COLLATERAL_ADAPTER_ABI } from "../shared/constants/abis";
import { testnetConfig } from "../shared/config/testnet";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

type AtlasRow = {
  messageId: string;
  sourceNetworkName?: string;
  destNetworkName?: string;
  sendTransactionHash?: string | null;
  commitTransactionHash?: string | null;
  blessTransactionHash?: string | null;
  receiptTransactionHash?: string | null;
  state?: string | null;
};

async function fetchAtlas(messageId: Hash): Promise<AtlasRow> {
  const url = `https://ccip.chain.link/api/h/atlas/message/${messageId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Atlas HTTP ${res.status} for ${url}`);
  return (await res.json()) as AtlasRow;
}

/** Newer API — often ahead of Atlas UI fields; includes `readyForManualExecution` and execution status. */
async function fetchV2Message(messageId: Hash): Promise<Record<string, unknown> | null> {
  const url = `https://api.ccip.chain.link/v2/messages/${messageId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

async function messageIdFromSepoliaTx(txHash: Hash): Promise<Hash> {
  const rpc = process.env.SEPOLIA_RPC_URL?.trim() || testnetConfig.source.rpcUrl;
  const adapter = testnetConfig.source.contracts.collateralAdapter as Hash;
  const client = createPublicClient({ transport: http(rpc) });
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  const logs = receipt.logs.filter((l) => l.address.toLowerCase() === adapter.toLowerCase());
  const parsed = parseEventLogs({
    abi: COLLATERAL_ADAPTER_ABI,
    logs,
    eventName: "Locked",
    strict: false,
  });
  const last = parsed[parsed.length - 1];
  const id = last?.args && typeof last.args === "object" && "ccipMessageId" in last.args
    ? (last.args.ccipMessageId as Hash)
    : undefined;
  if (!id) throw new Error("No Locked event / ccipMessageId in receipt");
  return id;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((a) => a !== "--");
  let messageId: Hash;
  if (argv[0]?.toLowerCase() === "tx" && argv[1]) {
    messageId = await messageIdFromSepoliaTx(argv[1] as Hash);
    console.log(`ccipMessageId from tx: ${messageId}\n`);
  } else if (argv[0]?.startsWith("0x")) {
    messageId = argv[0] as Hash;
  } else {
    console.error(`Usage: pnpm diagnose:ccip -- <0xmessageId>
       pnpm diagnose:ccip -- tx <0xsepoliaTxHash>`);
    process.exitCode = 1;
    return;
  }

  const row = await fetchAtlas(messageId);
  console.log("--- Atlas (explorer backend) ---");
  console.log(JSON.stringify(row, null, 2));
  console.log("");

  const v2 = await fetchV2Message(messageId);
  if (v2) {
    console.log("--- CCIP API v2 (authoritative for manual-exec) ---");
    console.log(JSON.stringify(v2, null, 2));
    console.log("");
  }

  const v2Status = typeof v2?.status === "string" ? v2.status : "";
  const receiptTx =
    (typeof v2?.receiptTransactionHash === "string" && v2.receiptTransactionHash) ||
    row.receiptTransactionHash ||
    null;
  const suggestManual =
    v2?.readyForManualExecution === true ||
    v2Status.toUpperCase().includes("FAIL");

  if (suggestManual) {
    console.log(
      "→ Permissionless / manual execution is appropriate (auto-exec failed, timed out, or not yet successful).\n" +
        "  **Commit** is done by the CCIP DON — you only **execute** on Arc via OffRamp (same as CCIP Explorer button).\n" +
        `  Run:\n    pnpm ccip:manual-exec -- ${messageId}\n` +
        "  If `ccipReceive` ran out of gas, retry with:\n" +
        `    pnpm ccip:manual-exec -- ${messageId} --gas-limit 500000\n` +
        "  Signer needs Arc gas: DEPLOYER_PRIVATE_KEY or CCIP_MANUAL_EXEC_PRIVATE_KEY in `.env`.",
    );
    return;
  }

  if (!v2) {
    if (!row.commitTransactionHash && !row.receiptTransactionHash) {
      console.log(
        "→ Atlas shows no commit/receipt yet (v2 API unreachable). Wait and re-run.\n" +
          "  Lane status: https://ccip.chain.link/status",
      );
    } else if (row.receiptTransactionHash) {
      console.log("→ Destination execution tx:", row.receiptTransactionHash);
    }
    return;
  }

  if (receiptTx && v2Status && !v2Status.toUpperCase().includes("FAIL")) {
    console.log("→ Destination execution tx:", receiptTx);
    console.log("  If indexer is running, CollateralRegistered should land in CollateralItem shortly.");
    return;
  }

  if (!row.commitTransactionHash && !row.receiptTransactionHash) {
    console.log(
      "→ Waiting on CCIP commit/execute. Hub CollateralItem fills after successful `ccipReceive`.\n" +
        "  https://ccip.chain.link/status",
    );
  } else if (receiptTx) {
    console.log("→ Destination execution tx:", receiptTx);
    console.log(
      "  If the hub still has no collateral, trace this tx on Arc — inner receiver may have reverted.",
    );
  }
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
