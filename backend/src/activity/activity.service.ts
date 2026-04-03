import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hubChainId } from "../lib/hub-config";

type UnifiedRow =
  | { source: "activity"; timestampUnix: bigint; row: Record<string, unknown> }
  | { source: "pool"; timestampUnix: bigint; row: Record<string, unknown> };

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(address: string, page = 1, limit = 20) {
    const actor = address.toLowerCase();
    const hc = hubChainId();
    const takeEach = Math.min(200, limit * 5);

    const [activityRows, poolRows] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where: {
          AND: [
            { OR: [{ actor }, { counterparty: actor }] },
            { OR: [{ hubChainId: hc }, { hubChainId: null }] },
          ],
        },
        orderBy: { timestampUnix: "desc" },
        take: takeEach,
      }),
      this.prisma.lendingPoolEvent.findMany({
        where: { hubChainId: hc, account: actor },
        orderBy: { timestampUnix: "desc" },
        take: takeEach,
      }),
    ]);

    const merged: UnifiedRow[] = [
      ...activityRows.map((row) => ({
        source: "activity" as const,
        timestampUnix: row.timestampUnix,
        row: { ...row },
      })),
      ...poolRows.map((row) => ({
        source: "pool" as const,
        timestampUnix: row.timestampUnix,
        row: { ...row },
      })),
    ];

    merged.sort((a, b) => (a.timestampUnix === b.timestampUnix ? 0 : a.timestampUnix < b.timestampUnix ? 1 : -1));

    const skip = (page - 1) * limit;
    const pageItems = merged.slice(skip, skip + limit);

    return {
      page,
      limit,
      items: pageItems,
    };
  }
}
