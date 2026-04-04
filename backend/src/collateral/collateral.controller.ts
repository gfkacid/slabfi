import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CollateralService } from "./collateral.service";

@ApiTags("collateral")
@Controller("collateral")
export class CollateralController {
  constructor(private readonly collateral: CollateralService) {}

  @Get("by-owner/:address")
  @ApiOperation({ summary: "All collateral items for a hub owner (borrower)" })
  @ApiParam({ name: "address" })
  byOwner(@Param("address") address: string) {
    return this.collateral.byOwner(address);
  }

  @Get("catalog")
  @ApiOperation({ summary: "All indexed collateral on the hub (catalog / explore)" })
  catalog() {
    return this.collateral.catalog();
  }

  @Get(":id")
  @ApiOperation({ summary: "Single collateral by bytes32 id (hex)" })
  @ApiParam({ name: "id" })
  byId(@Param("id") id: string) {
    return this.collateral.byId(id);
  }
}
