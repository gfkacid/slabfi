import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProtocolService {
  constructor(private readonly prisma: PrismaService) {}

  private hubChainId(): string {
    return process.env.BACKEND_HUB_CHAIN_ID ?? process.env.INDEXER_HUB_CHAIN_ID ?? "5042002";
  }

  async stats() {
    const hubChainId = this.hubChainId();
    const latest = await this.prisma.protocolSnapshot.findFirst({
      where: { hubChainId },
      orderBy: { timestampUnix: "desc" },
    });

    const positionCount = await this.prisma.position.count({ where: { hubChainId } });

    const depositorGroups = await this.prisma.lendingPoolEvent.groupBy({
      by: ["account"],
      where: { hubChainId, kind: "Deposited" },
    });
    const depositorCount = depositorGroups.length;

    return {
      hubChainId,
      latestSnapshot: latest,
      positionCount,
      depositorCount,
    };
  }

  async snapshots(period: "24h" | "7d" | "30d") {
    const hubChainId = this.hubChainId();
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    const seconds =
      period === "24h" ? 86400n : period === "7d" ? 86400n * 7n : 86400n * 30n;
    const from = nowSec - seconds;

    return this.prisma.protocolSnapshot.findMany({
      where: {
        hubChainId,
        timestampUnix: { gte: from },
      },
      orderBy: { timestampUnix: "asc" },
    });
  }
}
