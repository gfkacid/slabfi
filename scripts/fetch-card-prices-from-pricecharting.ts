/**
 * For every `Card` with a non-empty `pricechartingId`, calls the PriceCharting product API
 * (same flow as `CardsService.fetchPriceForCre`) and upserts `CardDailyPrice` + `latestPriceUsdc`.
 * Does not return oracle 8-decimal values — DB only.
 *
 * Requires: `DATABASE_URL`, `PRICECHARTING_API_KEY` in repo-root `.env`.
 * Optional: `PRICE_FETCH_COLLECTION` — lowercase 0x address; only update cards in that collection.
 * Optional: `PRICE_FETCH_DELAY_MS` — pause between API calls (default 0).
 *
 *   pnpm db:fetch:card-prices
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import {
  penniesToPriceUsdc,
  pricechartingFieldForGrade,
  readPenniesFromProduct,
  type PricechartingProductJson,
} from "../backend/src/cards/pricecharting";

const prisma = new PrismaClient();

function utcDateOnly(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  loadEnv({ path: resolve(scriptDir, "../.env") });

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  const apiKey = process.env.PRICECHARTING_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PRICECHARTING_API_KEY is required");
  }

  const collectionFilter = process.env.PRICE_FETCH_COLLECTION?.trim().toLowerCase();
  const delayMs = Math.max(0, Number(process.env.PRICE_FETCH_DELAY_MS ?? "0") || 0);

  const cards = await prisma.card.findMany({
    where: {
      AND: [
        { pricechartingId: { not: null } },
        { pricechartingId: { not: "" } },
        ...(collectionFilter ? [{ collection: collectionFilter }] : []),
      ],
    },
    select: {
      id: true,
      collection: true,
      tokenId: true,
      cardName: true,
      gradeService: true,
      grade: true,
      pricechartingId: true,
    },
  });

  if (cards.length === 0) {
    console.log(
      "[fetch-card-prices] No cards with pricechartingId" +
        (collectionFilter ? ` for collection ${collectionFilter}` : "") +
        ".",
    );
    return;
  }

  const day = utcDateOnly();
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const pcId = card.pricechartingId!.trim();
    const label = `${card.collection} token ${card.tokenId} (${card.cardName})`;

    const url = new URL("https://www.pricecharting.com/api/product");
    url.searchParams.set("t", apiKey);
    url.searchParams.set("id", pcId);

    let body: PricechartingProductJson;
    try {
      const res = await fetch(url.toString(), { method: "GET" });
      const text = await res.text();
      try {
        body = JSON.parse(text) as PricechartingProductJson;
      } catch {
        console.error(`[fetch-card-prices] ${label}: invalid JSON from PriceCharting`);
        failed++;
        continue;
      }
    } catch (e) {
      console.error(`[fetch-card-prices] ${label}: fetch failed`, e);
      failed++;
      continue;
    }

    if (body.status === "error") {
      const msg =
        typeof body["error-message"] === "string" ? body["error-message"] : "PriceCharting error";
      console.error(`[fetch-card-prices] ${label}: ${msg}`);
      failed++;
      continue;
    }

    const field = pricechartingFieldForGrade(card.gradeService, card.grade);
    const pennies = readPenniesFromProduct(body, field);
    if (pennies === null) {
      console.error(`[fetch-card-prices] ${label}: no usable ${field} in response`);
      failed++;
      continue;
    }

    const priceUsdc = penniesToPriceUsdc(pennies);

    await prisma.$transaction([
      prisma.cardDailyPrice.upsert({
        where: { cardId_date: { cardId: card.id, date: day } },
        create: {
          cardId: card.id,
          date: day,
          priceUsdc,
          source: "pricecharting",
        },
        update: { priceUsdc, source: "pricecharting" },
      }),
      prisma.card.update({
        where: { id: card.id },
        data: { latestPriceUsdc: priceUsdc },
      }),
    ]);

    console.log(`[fetch-card-prices] ${label} → latestPriceUsdc=${priceUsdc} (${field})`);
    ok++;
    if (delayMs > 0 && i < cards.length - 1) await sleep(delayMs);
  }

  console.log(`[fetch-card-prices] done: ${ok} updated, ${failed} failed, ${cards.length} total`);
  if (failed > 0) process.exitCode = 1;
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
