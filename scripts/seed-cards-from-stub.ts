/**
 * Upserts `Card` rows from `scripts/data/cardFi-collectibles-metadata.stub.json`
 * for token ids 1..N (row order). Set SEED_CARD_COLLECTION to your Sepolia
 * CardFiCollectible address (0x...). Optional PRICECHARTING_ID_N (1-based) per token.
 *
 *   pnpm --filter @slabfinance/indexer exec tsx ../scripts/seed-cards-from-stub.ts
 */
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { isAddress } from "viem";

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
};

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

  const collectionRaw = process.env.SEED_CARD_COLLECTION?.trim();
  if (!collectionRaw || !isAddress(collectionRaw)) {
    throw new Error("Set SEED_CARD_COLLECTION to a valid 0x address in .env");
  }
  const collection = collectionRaw.toLowerCase();

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
        tier: 2,
        ltvBps: 5000,
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
