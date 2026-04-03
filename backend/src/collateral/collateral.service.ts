import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hubChainId } from "../lib/hub-config";

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
    });
    if (!item) throw new NotFoundException("Collateral not found");
    return item;
  }

  byOwner(address: string) {
    return this.prisma.collateralItem.findMany({
      where: { hubChainId: this.hc(), owner: address.toLowerCase() },
      orderBy: { lockedAtUnix: "desc" },
    });
  }
}
