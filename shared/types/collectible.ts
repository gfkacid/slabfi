export interface SlabCollectible {
  tokenId: string;
  name: string;
  image?: string;
  collection?: string;
  /** EIP-155 chain id when the NFT is listed from Polygon / Base, etc. */
  chainId?: number;
  /** e.g. `courtyard` | `beezie` from protocol config */
  integrationId?: string;
  integrationLabel?: string;
  /** On-chain CardFiCollectible risk tier (1–3) when read from contract */
  riskTier?: number;
}

/** ERC-721 lock candidate on an EVM source chain (Courtyard, Beezie, …). */
export type EvmLockNft = SlabCollectible & {
  chainId: number;
  setName?: string;
  cardNumber?: string;
  cardRarity?: string;
  cardPrinting?: string;
};
