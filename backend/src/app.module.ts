import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { join } from "node:path";
import { ActivityModule } from "./activity/activity.module";
import { AuctionsModule } from "./auctions/auctions.module";
import { CardsModule } from "./cards/cards.module";
import { CollateralModule } from "./collateral/collateral.module";
import { HealthModule } from "./health/health.module";
import { PositionsModule } from "./positions/positions.module";
import { PrismaModule } from "./prisma/prisma.module";
import { OracleModule } from "./oracle/oracle.module";
import { ProtocolModule } from "./protocol/protocol.module";
import { InventoryModule } from "./inventory/inventory.module";
import { CrossChainModule } from "./cross-chain/cross-chain.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // cwd is backend/ when using pnpm --filter; DATABASE_URL lives in monorepo root .env
      envFilePath: [join(__dirname, "..", "..", ".env"), join(__dirname, "..", ".env")],
    }),
    PrismaModule,
    HealthModule,
    ProtocolModule,
    PositionsModule,
    AuctionsModule,
    CollateralModule,
    ActivityModule,
    CardsModule,
    OracleModule,
    InventoryModule,
    CrossChainModule,
  ],
})
export class AppModule {}
