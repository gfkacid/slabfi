import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isAddress } from "viem";
import { PrismaService } from "../prisma/prisma.service";
import {
  penniesToPriceUsdc,
  pricechartingFieldForGrade,
  priceUsdcToOracle8,
  readPenniesFromProduct,
  type PricechartingProductJson,
} from "./pricecharting";

function normalizeCollectionAddress(raw: string): string {
  const s = raw.trim();
  if (!isAddress(s)) {
    throw new BadRequestException("Invalid collection address");
  }
  return s.toLowerCase();
}

function utcDateOnly(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export type CardValuationResponse = {
  priceUSD: number;
  ltvBPS: number;
  tier: number;
  updatedAt?: string;
};

export type CrePriceResponse = {
  priceUsd: string;
};

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getValuation(
    collectionRaw: string,
    tokenIdRaw: string,
  ): Promise<CardValuationResponse> {
    const collection = normalizeCollectionAddress(collectionRaw);
    let tokenId: bigint;
    try {
      tokenId = BigInt(tokenIdRaw);
    } catch {
      throw new BadRequestException("Invalid token id");
    }

    const card = await this.prisma.card.findUnique({
      where: { collection_tokenId: { collection, tokenId } },
    });
    if (!card || card.latestPriceUsdc === null) {
      throw new NotFoundException("Card or price not found");
    }

    const n = Number(card.latestPriceUsdc);
    if (!Number.isSafeInteger(n)) {
      throw new BadGatewayException("Price out of safe range");
    }

    return {
      priceUSD: n,
      ltvBPS: card.ltvBps,
      tier: card.tier,
      updatedAt: card.updatedAt.toISOString(),
    };
  }

  async fetchPriceForCre(
    collectionRaw: string,
    tokenIdRaw: string,
  ): Promise<CrePriceResponse> {
    const collection = normalizeCollectionAddress(collectionRaw);
    let tokenId: bigint;
    try {
      tokenId = BigInt(tokenIdRaw);
    } catch {
      throw new BadRequestException("Invalid token id");
    }

    const card = await this.prisma.card.findUnique({
      where: { collection_tokenId: { collection, tokenId } },
    });
    if (!card) {
      throw new NotFoundException("Card not found");
    }
    if (!card.pricechartingId?.trim()) {
      throw new NotFoundException("Card has no pricechartingId");
    }

    const token = this.config.get<string>("PRICECHARTING_API_KEY")?.trim();
    if (!token) {
      throw new BadGatewayException("PRICECHARTING_API_KEY not configured");
    }

    const url = new URL("https://www.pricecharting.com/api/product");
    url.searchParams.set("t", token);
    url.searchParams.set("id", card.pricechartingId.trim());

    const res = await fetch(url.toString(), { method: "GET" });
    const text = await res.text();
    let body: PricechartingProductJson;
    try {
      body = JSON.parse(text) as PricechartingProductJson;
    } catch {
      throw new BadGatewayException("Invalid PriceCharting response");
    }

    if (body.status === "error") {
      const msg =
        typeof body["error-message"] === "string"
          ? body["error-message"]
          : "PriceCharting error";
      throw new BadGatewayException(msg);
    }

    const field = pricechartingFieldForGrade(card.gradeService, card.grade);
    const pennies = readPenniesFromProduct(body, field);
    if (pennies === null) {
      throw new BadGatewayException(
        `No usable ${field} in PriceCharting response`,
      );
    }

    const priceUsdc = penniesToPriceUsdc(pennies);
    const day = utcDateOnly();

    await this.prisma.$transaction([
      this.prisma.cardDailyPrice.upsert({
        where: {
          cardId_date: { cardId: card.id, date: day },
        },
        create: {
          cardId: card.id,
          date: day,
          priceUsdc,
          source: "pricecharting",
        },
        update: { priceUsdc, source: "pricecharting" },
      }),
      this.prisma.card.update({
        where: { id: card.id },
        data: { latestPriceUsdc: priceUsdc },
      }),
    ]);

    const oracle8 = priceUsdcToOracle8(priceUsdc);
    return { priceUsd: oracle8.toString() };
  }
}
