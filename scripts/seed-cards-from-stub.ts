/**
 * Upserts `Card` rows from `scripts/data/cardFi-collectibles-metadata.stub.json`
 * for token ids 1..N (row order). Each row may include `tier` (1–3); `ltvBps` is
 * derived to match hub OracleConsumer base LTV. Collection address: optional
 * SEED_CARD_COLLECTION in `.env`; if unset, uses `testnetConfig.source.contracts.slabFinanceCollectible`.
 * Optional PRICECHARTING_ID_N (1-based) per token.
 *
 *   pnpm --filter @slabfinance/indexer exec tsx ../scripts/seed-cards-from-stub.ts
 */
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { isAddress } from "viem";
import { testnetConfig } from "../shared/config/testnet";

const prisma = new PrismaClient();

type TokenRow = {
  cardName: string;
  cardImage: string;
  setName: string;
  cardNumber: string;
  cardRarity: string;
  cardPrinting: string;
  gradeService: string | null;
  grade: number | null;
  tier?: number;
};

/** Matches hub OracleConsumer baseLTV for tiers 1–3 (BPS). */
function ltvBpsForTier(tier: number): number {
  if (tier === 1) return 4000;
  if (tier === 2) return 2500;
  if (tier === 3) return 1500;
  return 2500;
}

function tierFromRow(t: TokenRow): number {
  const x = t.tier;
  if (x === undefined || x === null) return 2;
  if (!Number.isInteger(x) || x < 1 || x > 3) {
    throw new Error(`Invalid tier ${String(x)} — must be 1–3`);
  }
  return x;
}

function loadTokens(scriptDir: string): TokenRow[] {
  const path = join(scriptDir, "data/cardFi-collectibles-metadata.stub.json");
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as { tokens?: unknown };
  if (!Array.isArray(parsed.tokens)) {
    throw new Error(`Expected tokens array in ${path}`);
  }
  return parsed.tokens as TokenRow[];
}

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  loadEnv({ path: resolve(scriptDir, "../.env") });

  const fromEnv = process.env.SEED_CARD_COLLECTION?.trim();
  const fromConfig = testnetConfig.source.contracts.slabFinanceCollectible?.trim();
  const collectionRaw =
    fromEnv && isAddress(fromEnv)
      ? fromEnv
      : fromConfig && isAddress(fromConfig)
        ? fromConfig
        : "";
  if (!collectionRaw) {
    throw new Error(
      "No collectible address: set SEED_CARD_COLLECTION in .env or slabFinanceCollectible in shared/config/testnet.ts",
    );
  }
  const collection = collectionRaw.toLowerCase();
  if (fromEnv && isAddress(fromEnv)) {
    console.log(`[seed-cards] collection from SEED_CARD_COLLECTION`);
  } else {
    console.log(`[seed-cards] collection from testnetConfig.source.contracts.slabFinanceCollectible`);
  }

  const tokens = loadTokens(scriptDir);
  let n = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const tokenId = BigInt(i + 1);
    const gradeService =
      t.gradeService && String(t.gradeService).trim()
        ? String(t.gradeService).trim()
        : null;
    const grade =
      t.grade !== null && t.grade !== undefined && Number.isInteger(t.grade)
        ? t.grade
        : null;

    const pcEnv = process.env[`PRICECHARTING_ID_${i + 1}`]?.trim();
    const pricechartingId = pcEnv || null;
    const tier = tierFromRow(t);
    const ltvBps = ltvBpsForTier(tier);

    await prisma.card.upsert({
      where: { collection_tokenId: { collection, tokenId } },
      create: {
        collection,
        tokenId,
        cardName: t.cardName,
        cardImage: t.cardImage,
        setName: t.setName || null,
        cardNumber: t.cardNumber || null,
        cardRarity: t.cardRarity || null,
        cardPrinting: t.cardPrinting || null,
        gradeService,
        grade,
        pricechartingId,
        tier,
        ltvBps,
        latestPriceUsdc: null,
      },
      update: {
        cardName: t.cardName,
        cardImage: t.cardImage,
        setName: t.setName || null,
        cardNumber: t.cardNumber || null,
        cardRarity: t.cardRarity || null,
        cardPrinting: t.cardPrinting || null,
        gradeService,
        grade,
        tier,
        ltvBps,
        ...(pricechartingId !== null ? { pricechartingId } : {}),
      },
    });
    n++;
    console.log(`Upserted tokenId ${tokenId}`);
  }

  console.log(`Done. ${n} cards for collection ${collection}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
