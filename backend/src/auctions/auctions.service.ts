import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hubChainId } from "../lib/hub-config";

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

  private hc() {
    return hubChainId();
  }

  active() {
    return this.prisma.auction.findMany({
      where: {
        hubChainId: this.hc(),
        settled: false,
        cancelled: false,
      },
      include: {
        bids: { orderBy: { timestampUnix: "desc" } },
        settlement: true,
      },
      orderBy: { deadlineUnix: "asc" },
    });
  }

  async history(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      hubChainId: this.hc(),
      OR: [{ settled: true }, { cancelled: true }],
    };
    const [items, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        include: { settlement: true, bids: { orderBy: { timestampUnix: "desc" }, take: 5 } },
        orderBy: { deadlineUnix: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auction.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async byId(id: string) {
    const auction = await this.prisma.auction.findFirst({
      where: { id: id.toLowerCase(), hubChainId: this.hc() },
      include: {
        bids: { orderBy: { timestampUnix: "asc" } },
        settlement: true,
      },
    });
    if (!auction) throw new NotFoundException("Auction not found");
    return auction;
  }

  byBorrower(address: string) {
    return this.prisma.auction.findMany({
      where: { hubChainId: this.hc(), borrower: address.toLowerCase() },
      include: { settlement: true, bids: { orderBy: { timestampUnix: "desc" }, take: 10 } },
      orderBy: { startedAtUnix: "desc" },
    });
  }
}
