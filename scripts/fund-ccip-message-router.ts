/**
 * Sends native USDC (Arc: 6 decimals) from DEPLOYER_PRIVATE_KEY to
 * `testnetConfig.hub.contracts.ccipMessageRouter` for outbound CCIP fees.
 *
 * Default amount: **1 USDC** (= 1e6 smallest units).
 *
 * Repo-root `.env`: DEPLOYER_PRIVATE_KEY (required).
 * Optional: ARC_TESTNET_RPC — overrides hub RPC from testnet.ts.
 * Optional: ARC_TESTNET_RPC_TIMEOUT_MS — HTTP timeout (default 120000).
 * Optional: CCIP_FUND_RECEIPT_TIMEOUT_MS — waitForTransactionReceipt (default **15000** = 15s).
 * Optional: CCIP_MESSAGE_ROUTER_FUND_VALUE — smallest USDC units (6 decimals), decimal string (default: 1000000).
 *
 * Gas on Arc (inclusion): by default uses EIP-1559 from `estimateFeesPerGas` with a **3× bump** (`ARC_FUND_GAS_BUMP_PERCENT`,
 * default `300`). If txs never mine, match hub configure phase:
 * `ARC_FUND_CCIP_LEGACY=1` and optional `ARC_FUND_CCIP_GAS_PRICE` (wei) or reuse `ARC_CONFIGURE_GAS_PRICE`.
 *
 * Nonce backlog: if `eth_getTransactionCount(pending)` &gt; `latest`, earlier txs block inclusion. By default the script
 * **unsticks** with 0-value self-txs at `ARC_FUND_CCIP_UNSTICK_GAS_PRICE` (default 600 gwei). Set `ARC_FUND_CCIP_SKIP_UNSTICK=1` to skip.
 *
 *   pnpm ccip:fund-message-router
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  formatUnits,
  http,
  isAddress,
  parseUnits,
  WaitForTransactionReceiptTimeoutError,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { testnetConfig } from "../shared/config/testnet";

/** Percent multiplier for fee estimates, e.g. 300 = 3× maxFee / maxPriority. */
function parseBumpPercent(): bigint {
  const raw = process.env.ARC_FUND_GAS_BUMP_PERCENT?.trim() || "300";
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 100) return 300n;
  return BigInt(n);
}

function parseLegacyGasPriceWei(): bigint {
  const a = process.env.ARC_FUND_CCIP_GAS_PRICE?.trim();
  const b = process.env.ARC_CONFIGURE_GAS_PRICE?.trim();
  if (a) return BigInt(a);
  if (b) return BigInt(b);
  return 120_000_000_000n; // 120 gwei-style (same default as deploy-all.sh legacy configure)
}

async function buildGasOverrides(publicClient: PublicClient): Promise<
  | { type: "legacy"; gasPrice: bigint; gas: bigint }
  | {
      type: "eip1559";
      maxFeePerGas: bigint;
      maxPriorityFeePerGas: bigint;
      gas: bigint;
    }
> {
  const gas = 100_000n;
  const useLegacy =
    process.env.ARC_FUND_CCIP_LEGACY === "1" ||
    process.env.ARC_CONFIGURE_LEGACY === "1";
  const force1559 = process.env.ARC_FUND_CCIP_EIP1559 === "1";

  if (useLegacy && !force1559) {
    const gasPrice = parseLegacyGasPriceWei();
    return { type: "legacy", gasPrice, gas };
  }

  const bumpPct = parseBumpPercent();
  const mult = (wei: bigint) => (wei * bumpPct) / 100n;
  const floorPrio = 2_000_000_000n; // 2 gwei floor if estimate is tiny
  const fallbackMax = parseLegacyGasPriceWei();

  try {
    const fees = await publicClient.estimateFeesPerGas();
    const maxFee = mult(fees.maxFeePerGas ?? fallbackMax);
    const maxPrio = mult(fees.maxPriorityFeePerGas ?? floorPrio);
    const prio = maxPrio > floorPrio ? maxPrio : floorPrio;
    const fee = maxFee > fallbackMax ? maxFee : mult(fallbackMax);
    return {
      type: "eip1559",
      maxFeePerGas: fee,
      maxPriorityFeePerGas: prio,
      gas,
    };
  } catch {
    const gasPrice = parseLegacyGasPriceWei();
    return { type: "legacy", gasPrice, gas };
  }
}

/**
 * When `pending` nonce counter is ahead of `latest`, earlier txs are stuck in the mempool and
 * new sends (with nonce pending-1) never get included. Replace each stuck nonce with a 0-value
 * self-tx at aggressive legacy gas so the chain can advance.
 */
async function clearNonceBacklogIfNeeded(params: {
  publicClient: PublicClient;
  walletClient: WalletClient<Chain, Account>;
  chain: Chain;
  account: Account;
  receiptTimeout: number;
}): Promise<void> {
  if (process.env.ARC_FUND_CCIP_SKIP_UNSTICK === "1") return;

  const maxRounds = Number.parseInt(
    process.env.ARC_FUND_CCIP_UNSTICK_MAX_ROUNDS?.trim() || "25",
    10,
  );
  const unstickGas = BigInt(
    process.env.ARC_FUND_CCIP_UNSTICK_GAS_PRICE?.trim() || "600000000000",
  );
  const { publicClient, walletClient, chain, account, receiptTimeout } = params;
  const poll = Math.min(2_000, Math.max(500, receiptTimeout / 5));

  for (let round = 0; round < maxRounds; round++) {
    const latest = await publicClient.getTransactionCount({
      address: account.address,
      blockTag: "latest",
    });
    const pending = await publicClient.getTransactionCount({
      address: account.address,
      blockTag: "pending",
    });
    if (pending === latest) {
      if (round > 0) {
        console.log(`[fund-ccip-message-router] mempool clear after ${round} unstick tx(s)`);
      }
      return;
    }
    console.warn(
      `[fund-ccip-message-router] nonce backlog latest=${latest} pending=${pending} — replace nonce ${latest} (legacy gasPrice=${unstickGas})`,
    );
    const h = await walletClient.sendTransaction({
      account,
      chain,
      to: account.address,
      value: 0n,
      nonce: latest,
      gas: 21_000n,
      type: "legacy",
      gasPrice: unstickGas,
    });
    try {
      await publicClient.waitForTransactionReceipt({
        hash: h,
        timeout: receiptTimeout,
        pollingInterval: poll,
      });
    } catch (e) {
      if (e instanceof WaitForTransactionReceiptTimeoutError) {
        const r = await publicClient.getTransactionReceipt({ hash: h }).catch(() => null);
        if (!r) {
          console.warn(
            `[fund-ccip-message-router] unstick ${h} not confirmed in ${receiptTimeout}ms — retrying loop`,
          );
        }
      } else {
        throw e;
      }
    }
  }
  throw new Error(
    `Nonce backlog not cleared in ${maxRounds} rounds. Raise ARC_FUND_CCIP_UNSTICK_GAS_PRICE or inspect ArcScan.`,
  );
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  loadEnv({ path: resolve(scriptDir, "../.env") });

  const router = testnetConfig.hub.contracts.ccipMessageRouter?.trim();
  if (!router || !isAddress(router)) {
    throw new Error(
      "hub.contracts.ccipMessageRouter missing or invalid in shared/config/testnet.ts",
    );
  }

  const pkRaw = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pkRaw?.trim()) {
    throw new Error("DEPLOYER_PRIVATE_KEY is not set (repo .env or environment).");
  }
  const pk = (pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`) as Hex;
  const account = privateKeyToAccount(pk);

  const NATIVE_USDC_DECIMALS = 6;
  const fundRaw = process.env.CCIP_MESSAGE_ROUTER_FUND_VALUE?.trim();
  const value =
    fundRaw !== undefined && fundRaw !== ""
      ? BigInt(fundRaw)
      : parseUnits("1", NATIVE_USDC_DECIMALS);

  const rpcUrl = process.env.ARC_TESTNET_RPC?.trim() || testnetConfig.hub.rpcUrl;
  if (!rpcUrl) {
    throw new Error("No Arc RPC: set ARC_TESTNET_RPC or hub.rpcUrl in testnet.ts");
  }

  const rpcTimeoutMs = Number.parseInt(process.env.ARC_TESTNET_RPC_TIMEOUT_MS || "120000", 10);
  const rpcTimeout =
    Number.isFinite(rpcTimeoutMs) && rpcTimeoutMs > 0 ? rpcTimeoutMs : 120_000;
  const receiptTimeoutRaw = process.env.CCIP_FUND_RECEIPT_TIMEOUT_MS;
  const receiptTimeoutParsed = receiptTimeoutRaw
    ? Number.parseInt(receiptTimeoutRaw, 10)
    : 15_000;
  const receiptTimeout =
    Number.isFinite(receiptTimeoutParsed) && receiptTimeoutParsed > 0
      ? receiptTimeoutParsed
      : 15_000;

  let rpcLabel = rpcUrl;
  try {
    rpcLabel = new URL(rpcUrl).host;
  } catch {
    /* keep raw */
  }
  console.log(
    `[fund-ccip-message-router] RPC ${rpcLabel}${process.env.ARC_TESTNET_RPC?.trim() ? " (ARC_TESTNET_RPC)" : " (testnet.ts)"}; HTTP timeout ${rpcTimeout}ms; receipt wait ${receiptTimeout}ms`,
  );

  const chain = defineChain({
    id: testnetConfig.hub.chainId,
    name: testnetConfig.hub.name,
    nativeCurrency: { decimals: NATIVE_USDC_DECIMALS, name: "USDC", symbol: "USDC" },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: {
      default: { name: "ArcScan", url: testnetConfig.hub.blockExplorer },
    },
  });

  const transport = http(rpcUrl, { timeout: rpcTimeout, retryCount: 2 });
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ account, chain, transport });

  await clearNonceBacklogIfNeeded({
    publicClient,
    walletClient,
    chain,
    account,
    receiptTimeout,
  });

  const to = router as Address;
  const balanceBefore = await publicClient.getBalance({ address: to });
  console.log(
    `[fund-ccip-message-router] ${account.address} → ${to} value=${value} (${formatUnits(value, NATIVE_USDC_DECIMALS)} USDC)`,
  );
  console.log(`[fund-ccip-message-router] router balance before: ${balanceBefore}`);

  const gasOpts = await buildGasOverrides(publicClient);
  if (gasOpts.type === "legacy") {
    console.log(
      `[fund-ccip-message-router] gas: legacy gasPrice=${gasOpts.gasPrice} gas=${gasOpts.gas}`,
    );
  } else {
    console.log(
      `[fund-ccip-message-router] gas: EIP-1559 maxFeePerGas=${gasOpts.maxFeePerGas} maxPriorityFeePerGas=${gasOpts.maxPriorityFeePerGas} gas=${gasOpts.gas} (bump ${parseBumpPercent()}%)`,
    );
  }

  const hash = await walletClient.sendTransaction({
    to,
    value,
    account,
    chain,
    gas: gasOpts.gas,
    ...(gasOpts.type === "legacy"
      ? { type: "legacy" as const, gasPrice: gasOpts.gasPrice }
      : {
          maxFeePerGas: gasOpts.maxFeePerGas,
          maxPriorityFeePerGas: gasOpts.maxPriorityFeePerGas,
        }),
  });
  console.log(`[fund-ccip-message-router] submitted ${hash} — waiting for receipt…`);
  const explorerBase = testnetConfig.hub.blockExplorer.replace(/\/$/, "");
  const explorerTx = `${explorerBase}/tx/${hash}`;

  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: receiptTimeout,
      pollingInterval: Math.min(2_000, Math.max(1_000, receiptTimeout / 5)),
    });
  } catch (e) {
    if (e instanceof WaitForTransactionReceiptTimeoutError) {
      console.warn(
        `[fund-ccip-message-router] receipt wait exceeded ${receiptTimeout}ms — checking once more…`,
      );
      receipt = await publicClient.getTransactionReceipt({ hash }).catch(() => null);
      if (!receipt) {
        console.error(
          `[fund-ccip-message-router] not confirmed within ${receiptTimeout}ms. Track: ${explorerTx}\n` +
            `  If the tx is stuck, raise gas (ARC_FUND_CCIP_LEGACY=1) or check balance/RPC. Re-run sends another transfer.`,
        );
        process.exit(1);
      }
      console.log(`[fund-ccip-message-router] receipt found after timeout (chain was slow).`);
    } else {
      throw e;
    }
  }

  if (receipt.status !== "success") {
    throw new Error(`Transaction reverted: ${hash} — ${explorerTx}`);
  }

  const balanceAfter = await publicClient.getBalance({ address: to });
  console.log(`[fund-ccip-message-router] confirmed ${hash}`);
  console.log(`[fund-ccip-message-router] explorer: ${explorerTx}`);
  console.log(`[fund-ccip-message-router] router balance after: ${balanceAfter}`);
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
