import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hubChainId } from "../lib/hub-config";
import { mergeCardByCollectionTokenId } from "./merge-card-metadata";

@Injectable()
export class CollateralService {
  constructor(private readonly prisma: PrismaService) {}

  private hc() {
    return hubChainId();
  }

  async byId(id: string) {
    const normalized = id.startsWith("0x") ? id.toLowerCase() : `0x${id.toLowerCase()}`;
    const item = await this.prisma.collateralItem.findFirst({
      where: { id: normalized, hubChainId: this.hc() },
      include: { card: true },
    });
    if (!item) throw new NotFoundException("Collateral not found");
    const [enriched] = await mergeCardByCollectionTokenId(this.prisma, [item]);
    return enriched;
  }

  async byOwner(address: string) {
    const items = await this.prisma.collateralItem.findMany({
      where: { hubChainId: this.hc(), owner: address.toLowerCase() },
      orderBy: { lockedAtUnix: "desc" },
      include: { card: true },
    });
    return mergeCardByCollectionTokenId(this.prisma, items);
  }

  /** Protocol catalog: active collateral on the hub (capped). */
  async catalog(limit = 500) {
    const cap = Math.min(Math.max(1, limit), 1000);
    const items = await this.prisma.collateralItem.findMany({
      where: { hubChainId: this.hc() },
      orderBy: { lockedAtUnix: "desc" },
      take: cap,
      include: { card: true },
    });
    return mergeCardByCollectionTokenId(this.prisma, items);
  }
}
