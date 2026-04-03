import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ActivityService } from "./activity.service";

@ApiTags("activity")
@Controller("activity")
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get(":address")
  @ApiOperation({ summary: "Unified activity (indexed events + pool events)" })
  @ApiParam({ name: "address" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  feed(
    @Param("address") address: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.activity.feed(address, page, Math.min(limit, 100));
  }
}
