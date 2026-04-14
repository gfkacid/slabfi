import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { isAddress } from "viem";
import { protocolConfig } from "@slabfinance/shared";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get("evm/:chainId/:wallet")
  @ApiOperation({
    summary: "Owned token ids for the protocol-configured collection on Polygon / Base",
  })
  @ApiParam({ name: "chainId", description: "EIP-155 chain id (e.g. 137, 8453)" })
  @ApiParam({ name: "wallet", description: "Owner 0x address" })
  async evmOwned(@Param("chainId") chainId: string, @Param("wallet") wallet: string) {
    const cid = Number(chainId);
    if (!Number.isFinite(cid)) return { tokenIds: [] as string[] };
    const w = wallet.trim();
    if (!isAddress(w)) return { tokenIds: [] as string[] };

    const src = Object.values(protocolConfig.evmSources).find((s) => s.chainId === cid);
    const col = (src?.contracts.collection || "").trim();
    if (!col || !isAddress(col)) return { tokenIds: [] as string[] };

    const tokenIds = await this.inventory.listOwnedTokenIds(cid, col as `0x${string}`, w as `0x${string}`);
    return { tokenIds };
  }
}
