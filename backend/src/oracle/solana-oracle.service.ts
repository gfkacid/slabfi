import { Injectable, Logger } from "@nestjs/common";
import { PublicKey } from "@solana/web3.js";
import { hubConnection } from "../lib/hub-config";
import { loadKeypairFromEnv } from "../solana/keypair.util";
import { oracleSetPriceIx, sendVersionedTx } from "../solana/slab-hub";

/**
 * Pushes oracle prices to the Solana `slab_hub` program (`oracle_set_price`).
 * Requires `ORACLE_AUTHORITY_KEYPAIR` (JSON array or path to keypair JSON).
 */
@Injectable()
export class SolanaOracleService {
  private readonly log = new Logger(SolanaOracleService.name);

  async pushPrice(collectionMint: string, tokenId: bigint, priceUsd8d: bigint, tier: number): Promise<string | null> {
    const kp = loadKeypairFromEnv("ORACLE_AUTHORITY_KEYPAIR");
    if (!kp) {
      this.log.warn("ORACLE_AUTHORITY_KEYPAIR not set — skip oracle_set_price");
      return null;
    }
    const conn = hubConnection();
    const mint = new PublicKey(collectionMint);
    const ix = oracleSetPriceIx({
      oracleAuthority: kp.publicKey,
      collectionMint: mint,
      tokenId,
      priceUsd8d,
      tier: tier & 0xff,
    });
    const sig = await sendVersionedTx(conn, kp, [kp], [ix]);
    this.log.log(`oracle_set_price ${sig} mint=${collectionMint} token=${tokenId}`);
    return sig;
  }
}
