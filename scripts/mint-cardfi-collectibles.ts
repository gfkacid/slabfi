/**
 * Mints every entry in the metadata JSON to a fixed recipient using on-chain incremental token ids.
 *
 * Metadata file: `scripts/data/cardFi-collectibles-metadata.stub.json` — top-level
 * object with a `tokens` array (at least one entry). Each entry: cardName, cardImage,
 * setName, cardNumber, cardRarity, cardPrinting, gradeService, grade, tier (1–3).
 * `gradeService` and `grade` may be JSON `null` (treated as "" and 0). Omit `tier` to
 * default to 2. No tokenId field; ids come from {mintWithMetadata}.
 *
 * Contract address: `testnetConfig.source.contracts.slabFinanceCollectible` in shared/config/testnet.ts.
 * Signer: DEPLOYER_PRIVATE_KEY (must be contract owner). Loads repo-root `.env` when present.
 *
 * Re-run with the same JSON to mint the same metadata rows again (ids continue from the
 * contract's counter). Change `MINT_RECIPIENT` between runs to send batches to different wallets.
 *
 * From repo root:
 *   pnpm --filter @slabfinance/indexer exec tsx ../scripts/mint-cardfi-collectibles.ts
 *   # or: pnpm mint:collectibles
 */
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, type Address, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { testnetConfig } from "../shared/config/testnet";

/** Replace with the wallet that should receive this batch. */
const MINT_RECIPIENT = "0x0000000000000000000000000000000000000001" as const satisfies Address;

const METADATA_RELATIVE = "data/cardFi-collectibles-metadata.stub.json";

const cardFiCollectibleAbi = [
  {
    type: "function",
    name: "mintWithMetadata",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      {
        name: "metadata",
        type: "tuple",
        components: [
          { name: "cardName", type: "string" },
          { name: "cardImage", type: "string" },
          { name: "setName", type: "string" },
          { name: "cardNumber", type: "string" },
          { name: "cardRarity", type: "string" },
          { name: "cardPrinting", type: "string" },
          { name: "gradeService", type: "string" },
          { name: "grade", type: "uint16" },
          { name: "tier", type: "uint8" },
        ],
      },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

type TokenRow = {
  cardName: string;
  cardImage: string;
  setName: string;
  cardNumber: string;
  cardRarity: string;
  cardPrinting: string;
  gradeService: string;
  grade: number;
  tier: number;
};

function normGradeService(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v !== "string") {
    throw new Error(`gradeService must be string or null, got ${typeof v}`);
  }
  return v;
}

function normGrade(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v !== "number" || !Number.isInteger(v)) {
    throw new Error(`grade must be integer or null, got ${JSON.stringify(v)}`);
  }
  if (v < 0 || v > 65535) {
    throw new Error(`grade out of uint16 range: ${v}`);
  }
  return v;
}

function normTier(v: unknown): number {
  if (v === null || v === undefined) return 2;
  if (typeof v !== "number" || !Number.isInteger(v)) {
    throw new Error(`tier must be integer 1–3 or omitted, got ${JSON.stringify(v)}`);
  }
  if (v < 1 || v > 3) {
    throw new Error(`tier must be 1–3, got ${v}`);
  }
  return v;
}

function parseTokenRow(row: unknown): TokenRow {
  if (row === null || typeof row !== "object") {
    throw new Error(`Invalid token row: ${JSON.stringify(row)}`);
  }
  const t = row as Record<string, unknown>;
  const str = (k: string) => {
    const v = t[k];
    if (typeof v !== "string") {
      throw new Error(`Invalid or missing string field "${k}": ${JSON.stringify(row)}`);
    }
    return v;
  };
  return {
    cardName: str("cardName"),
    cardImage: str("cardImage"),
    setName: str("setName"),
    cardNumber: str("cardNumber"),
    cardRarity: str("cardRarity"),
    cardPrinting: str("cardPrinting"),
    gradeService: normGradeService(t.gradeService),
    grade: normGrade(t.grade),
    tier: normTier(t.tier),
  };
}

function loadTokens(scriptDir: string): TokenRow[] {
  const path = join(scriptDir, METADATA_RELATIVE);
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as { tokens?: unknown };
  if (!Array.isArray(parsed.tokens)) {
    throw new Error(`Expected "${path}" to have a "tokens" array`);
  }
  if (parsed.tokens.length < 1) {
    throw new Error(`Expected at least one token, got ${parsed.tokens.length}`);
  }

  return parsed.tokens.map((row, i) => {
    try {
      return parseTokenRow(row);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`tokens[${i}]: ${msg}`);
    }
  });
}

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  loadEnv({ path: resolve(scriptDir, "../.env") });

  const collectible = testnetConfig.source.contracts.slabFinanceCollectible.trim();
  if (!collectible || !collectible.startsWith("0x")) {
    throw new Error(
      "Set shared/config/testnet.ts → source.contracts.slabFinanceCollectible to your deployed CardFiCollectible address.",
    );
  }

  const pkRaw = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pkRaw?.trim()) {
    throw new Error("DEPLOYER_PRIVATE_KEY is not set (repo .env or environment).");
  }
  const pk = (pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`) as Hex;
  const account = privateKeyToAccount(pk);

  const chainId = testnetConfig.source.chainId;
  if (chainId !== sepolia.id) {
    throw new Error(
      `Expected testnetConfig.source.chainId ${sepolia.id} (Sepolia), got ${chainId}`,
    );
  }

  const tokens = loadTokens(scriptDir);
  const transport = http(testnetConfig.source.rpcUrl);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport,
  });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport,
  });

  const address = collectible as Address;

  for (const t of tokens) {
    const metadata = {
      cardName: t.cardName,
      cardImage: t.cardImage,
      setName: t.setName,
      cardNumber: t.cardNumber,
      cardRarity: t.cardRarity,
      cardPrinting: t.cardPrinting,
      gradeService: t.gradeService,
      grade: t.grade,
      tier: t.tier,
    } as const;

    const hash = await walletClient.writeContract({
      address,
      abi: cardFiCollectibleAbi,
      functionName: "mintWithMetadata",
      args: [MINT_RECIPIENT, metadata],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    const next = await publicClient.readContract({
      address,
      abi: cardFiCollectibleAbi,
      functionName: "nextTokenId",
    });
    const mintedId = next - 1n;
    console.log(`tokenId ${mintedId}: mintWithMetadata tx ${hash}`);
  }

  console.log("Done. Recipient:", MINT_RECIPIENT);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
