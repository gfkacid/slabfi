import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { protocolConfig } from "@slabfinance/shared";
import type { SlabCollectible } from "@slabfinance/shared";

export type SolanaSlabNft = SlabCollectible & {
  mint: string;
  kind: "pnft" | "cnft";
};

/**
 * Lists NFTs from whitelisted Collector Crypt / Phygitals collection mints for the connected Solana wallet.
 * Uses parsed token accounts (legacy SPL NFTs). cNFT / pNFT-only paths can extend this with Metaplex DAS.
 */
export function useSolanaCollectibles(enabled = true) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wl = protocolConfig.hub.whitelistedCollections;

  return useQuery({
    queryKey: ["solana-whitelist-nfts", publicKey?.toBase58(), wl.collectorCrypt.mint, wl.phygitals.mint],
    queryFn: async (): Promise<SolanaSlabNft[]> => {
      if (!publicKey) return [];
      const mints: string[] = [String(wl.collectorCrypt.mint), String(wl.phygitals.mint)].filter(
        (m) => m.length > 0,
      );
      if (mints.length === 0) return [];

      const out: SolanaSlabNft[] = [];
      const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") });
      for (const { pubkey, account } of resp.value) {
        const parsed = account.data as { parsed?: { info?: { mint?: string; tokenAmount?: { amount?: string; decimals?: number } } } };
        const mint = parsed.parsed?.info?.mint;
        const amount = parsed.parsed?.info?.tokenAmount?.amount;
        const decimals = parsed.parsed?.info?.tokenAmount?.decimals ?? 0;
        if (!mint || !mints.includes(mint) || amount !== "1" || decimals !== 0) continue;
        const phyMint = String(wl.phygitals.mint);
        const kind: "pnft" | "cnft" =
          phyMint.length > 0 && mint === phyMint ? "cnft" : "pnft";
        out.push({
          tokenId: pubkey.toBase58(),
          name: `NFT ${mint.slice(0, 4)}…`,
          image: undefined,
          collection: mint,
          mint,
          kind,
        });
      }
      return out;
    },
    enabled: enabled && !!publicKey,
  });
}
