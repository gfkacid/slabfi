import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuctionsService } from "./auctions.service";

@ApiTags("auctions")
@Controller("auctions")
export class AuctionsController {
  constructor(private readonly auctions: AuctionsService) {}

  @Get("active")
  @ApiOperation({ summary: "Open auctions (not settled, not cancelled)" })
  active() {
    return this.auctions.active();
  }

  @Get("history")
  @ApiOperation({ summary: "Settled or cancelled auctions" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  history(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.auctions.history(page, Math.min(limit, 100));
  }

  @Get("by-borrower/:address")
  @ApiOperation({ summary: "Auctions for a borrower" })
  @ApiParam({ name: "address" })
  byBorrower(@Param("address") address: string) {
    return this.auctions.byBorrower(address);
  }

  @Get(":id")
  @ApiOperation({ summary: "Auction detail with full bid list" })
  @ApiParam({ name: "id", description: "auctionId (bytes32 hex)" })
  byId(@Param("id") id: string) {
    return this.auctions.byId(id);
  }
}
