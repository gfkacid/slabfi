import type { Card, CollateralItem } from "@prisma/client";
import type { PrismaService } from "../prisma/prisma.service";

export type CollateralItemWithCard = CollateralItem & { card: Card | null };

/**
 * When `cardId` is unset on hub collateral, still attach the matching `Card` row
 * by `collection` + `tokenId` so the API returns metadata (name, image, LTV, grade).
 */
export async function mergeCardByCollectionTokenId(
  prisma: PrismaService,
  items: CollateralItemWithCard[],
): Promise<CollateralItemWithCard[]> {
  const needLookup = items.filter((i) => !i.card);
  if (needLookup.length === 0) return items;

  const uniqueKeys = new Map<string, { collection: string; tokenId: bigint }>();
  for (const i of needLookup) {
    const collection = i.collection.toLowerCase();
    const k = `${collection}:${i.tokenId.toString()}`;
    if (!uniqueKeys.has(k)) {
      uniqueKeys.set(k, { collection, tokenId: i.tokenId });
    }
  }
  const pairs = [...uniqueKeys.values()];

  const cards = await prisma.card.findMany({
    where: {
      OR: pairs.map((p) => ({
        collection: p.collection,
        tokenId: p.tokenId,
      })),
    },
  });

  const cardByKey = new Map<string, Card>();
  for (const c of cards) {
    cardByKey.set(`${c.collection.toLowerCase()}:${c.tokenId.toString()}`, c);
  }

  return items.map((i) => {
    if (i.card) return i;
    const resolved = cardByKey.get(`${i.collection.toLowerCase()}:${i.tokenId.toString()}`);
    return resolved ? { ...i, card: resolved } : i;
  });
}
