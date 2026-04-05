import { Injectable } from "@nestjs/common";
import { COLLATERAL_REGISTRY_ABI, HEALTH_FACTOR_ENGINE_ABI } from "@slabfinance/shared";
import { createPublicClient, http, type Address } from "viem";
import { PrismaService } from "../prisma/prisma.service";
import {
  collateralRegistryAddress,
  healthFactorEngineAddress,
  hubChainId,
  hubRpcUrl,
} from "../lib/hub-config";
import { mergeCardByCollectionTokenId } from "../collateral/merge-card-metadata";

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByAddress(address: string) {
    const borrower = address.toLowerCase();
    const hc = hubChainId();

    const position = await this.prisma.position.findUnique({
      where: { borrower },
    });

    const collateralRows = await this.prisma.collateralItem.findMany({
      where: { hubChainId: hc, owner: borrower },
      orderBy: { lockedAtUnix: "desc" },
      include: { card: true },
    });
    const collaterals = await mergeCardByCollectionTokenId(this.prisma, collateralRows);

    const rpc = hubRpcUrl();
    const registry = collateralRegistryAddress();
    const hfEngine = healthFactorEngineAddress();

    let availableCredit: bigint | null = null;
    let positionStatus: number | null = null;

    if (rpc && registry && hfEngine) {
      const client = createPublicClient({ transport: http(rpc) });
      try {
        availableCredit = await client.readContract({
          address: registry,
          abi: COLLATERAL_REGISTRY_ABI,
          functionName: "availableCredit",
          args: [borrower as Address],
        });
      } catch {
        availableCredit = null;
      }
      try {
        positionStatus = await client.readContract({
          address: hfEngine,
          abi: HEALTH_FACTOR_ENGINE_ABI,
          functionName: "getPositionStatus",
          args: [borrower as Address],
        });
      } catch {
        positionStatus = null;
      }
    }

    return {
      hubChainId: hc,
      borrower,
      indexedPosition: position,
      collaterals,
      live: {
        availableCredit,
        positionStatus,
      },
    };
  }
}
