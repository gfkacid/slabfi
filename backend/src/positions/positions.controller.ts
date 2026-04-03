import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { PositionsService } from "./positions.service";

@ApiTags("positions")
@Controller("positions")
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Get(":address")
  @ApiOperation({ summary: "Borrower position from indexer + optional live hub reads" })
  @ApiParam({ name: "address", description: "0x-prefixed hub borrower address" })
  byAddress(@Param("address") address: string) {
    return this.positions.getByAddress(address);
  }
}
