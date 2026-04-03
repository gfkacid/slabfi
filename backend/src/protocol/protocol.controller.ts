import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProtocolService } from "./protocol.service";

@ApiTags("protocol")
@Controller("protocol")
export class ProtocolController {
  constructor(private readonly protocol: ProtocolService) {}

  @Get("stats")
  @ApiOperation({ summary: "Latest protocol metrics from indexer snapshots" })
  stats() {
    return this.protocol.stats();
  }

  @Get("snapshots")
  @ApiOperation({ summary: "Time series of ProtocolSnapshot rows" })
  @ApiQuery({ name: "period", enum: ["24h", "7d", "30d"], required: false })
  snapshots(@Query("period") period?: string) {
    const p = period === "7d" || period === "30d" ? period : "24h";
    return this.protocol.snapshots(p);
  }
}
