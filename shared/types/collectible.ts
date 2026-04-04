export interface SlabCollectible {
  tokenId: string;
  name: string;
  image?: string;
  collection?: string;
  /** On-chain CardFiCollectible risk tier (1–3) when read from contract */
  riskTier?: number;
}
