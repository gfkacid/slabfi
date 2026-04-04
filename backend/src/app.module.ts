import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "node:path";
import { ActivityModule } from "./activity/activity.module";
import { AuctionsModule } from "./auctions/auctions.module";
import { CardsModule } from "./cards/cards.module";
import { CollateralModule } from "./collateral/collateral.module";
import { HealthModule } from "./health/health.module";
import { PositionsModule } from "./positions/positions.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProtocolModule } from "./protocol/protocol.module";

@Module({
  imports: [
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
  ],
})
export class AppModule {}
