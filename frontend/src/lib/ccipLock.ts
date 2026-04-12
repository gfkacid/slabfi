import type { Abi, Hash, TransactionReceipt } from "viem";
import { getAddress, parseEventLogs } from "viem";

/** LayerZero Scan (cross-chain message tracking). */
export const LAYERZERO_SCAN_URL = "https://layerzeroscan.com";

/** @deprecated CCIP replaced by LayerZero; kept for legacy receipts. */
export const CCIP_EXPLORER_URL = "https://ccip.chain.link";

export function ccipAtlasApiUrl(ccipMessageId: Hash): string {
  return `https://ccip.chain.link/api/h/atlas/message/${ccipMessageId}`;
}

/**
 * Reads `Locked` from a lock tx receipt (same contract as `lockAndNotify`).
 */
export function ccipMessageIdFromLockReceipt(
  receipt: TransactionReceipt,
  adapterAddress: string,
  abi: Abi | readonly unknown[],
): Hash | undefined {
  const adapter = getAddress(adapterAddress);
  const logs = receipt.logs.filter((l) => getAddress(l.address) === adapter);
  const parsed = parseEventLogs({ abi: abi as Abi, logs, eventName: "Locked", strict: false });
  const last = parsed[parsed.length - 1];
  const args = last?.args as { ccipMessageId?: Hash } | undefined;
  if (!args?.ccipMessageId) return undefined;
  return args.ccipMessageId;
}
