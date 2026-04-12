import { Module } from "@nestjs/common";
import { CardsModule } from "../cards/cards.module";
import { OracleModule } from "../oracle/oracle.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CrossChainRelayService } from "./cross-chain-relay.service";

@Module({
  imports: [PrismaModule, CardsModule, OracleModule],
  providers: [CrossChainRelayService],
})
export class CrossChainModule {}
