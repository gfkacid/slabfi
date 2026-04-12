import { readFileSync, existsSync } from "node:fs";
import { Keypair } from "@solana/web3.js";

/**
 * Loads a Solana keypair from `process.env[name]`.
 * Value may be a path to a JSON keypair file, or a JSON array of 64 numbers (Anchor / solana-cli format).
 */
export function loadKeypairFromEnv(name: string): Keypair | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  try {
    if (raw.startsWith("[")) {
      const arr = JSON.parse(raw) as number[];
      if (!Array.isArray(arr) || arr.length < 64) return null;
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    }
    if (existsSync(raw)) {
      const parsed = JSON.parse(readFileSync(raw, "utf8")) as number[];
      if (!Array.isArray(parsed) || parsed.length < 64) return null;
      return Keypair.fromSecretKey(Uint8Array.from(parsed));
    }
  } catch {
    return null;
  }
  return null;
}
