import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class HealthController {
  @Get()
  health(): { ok: boolean } {
    return { ok: true };
  }

  @Get("health")
  healthAlias(): { ok: boolean } {
    return { ok: true };
  }
}
