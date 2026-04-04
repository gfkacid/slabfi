import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers["x-api-key"];
    const provided = Array.isArray(header) ? header[0] : header;
    const expected = this.config.get<string>("SLABFI_API_KEY")?.trim();

    if (!expected) {
      throw new UnauthorizedException("API key not configured");
    }
    if (typeof provided !== "string" || !provided.trim()) {
      throw new UnauthorizedException();
    }
    if (provided.trim() !== expected) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
