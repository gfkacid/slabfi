import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CardsController } from "./cards.controller";
import { CardsService } from "./cards.service";
import { ApiKeyGuard } from "../guards/api-key.guard";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [CardsController],
  providers: [CardsService, ApiKeyGuard],
})
export class CardsModule {}
