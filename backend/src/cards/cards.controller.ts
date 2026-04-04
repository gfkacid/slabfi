import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { ApiKeyGuard } from "../guards/api-key.guard";
import { CardsService } from "./cards.service";

@ApiTags("cards")
@Controller("cards")
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get(":collection/:tokenId/valuation")
  @ApiOperation({
    summary: "Latest stored card valuation for deposit UI (6-decimal USDC priceUSD)",
  })
  @ApiParam({ name: "collection", description: "NFT collection address (hex)" })
  @ApiParam({ name: "tokenId", description: "Token id (decimal string)" })
  valuation(
    @Param("collection") collection: string,
    @Param("tokenId") tokenId: string,
  ) {
    return this.cards.getValuation(collection, tokenId);
  }

  @Get(":collection/:tokenId/price")
  @UseGuards(ApiKeyGuard)
  @ApiSecurity("x-api-key")
  @ApiOperation({
    summary:
      "CRE: fetch PriceCharting quote, persist daily price, return 8-decimal USD for OracleConsumer",
  })
  @ApiParam({ name: "collection", description: "NFT collection address (hex)" })
  @ApiParam({ name: "tokenId", description: "Token id (decimal string)" })
  crePrice(
    @Param("collection") collection: string,
    @Param("tokenId") tokenId: string,
  ) {
    return this.cards.fetchPriceForCre(collection, tokenId);
  }
}
