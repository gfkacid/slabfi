import { Module } from "@nestjs/common";
import { SolanaOracleService } from "./solana-oracle.service";

@Module({
  providers: [SolanaOracleService],
  exports: [SolanaOracleService],
})
export class OracleModule {}
