import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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
    ConfigModule.forRoot({ isGlobal: true }),
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
