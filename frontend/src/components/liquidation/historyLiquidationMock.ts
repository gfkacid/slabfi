/** Stitch MCP reference rows — no on-chain history indexer yet. */
export type HistoryLiquidationRow = {
  assetName: string;
  assetSubtitle: string;
  imageUrl: string;
  winningBidUsdc: string;
  closingDate: string;
  explorerHref: string;
};

export const HISTORY_LIQUIDATION_ROWS: readonly HistoryLiquidationRow[] = [
  {
    assetName: "Charizard 1st Ed.",
    assetSubtitle: "Liquidated 12.4 ETH worth",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuChj0elKlYGIwr6foHsejuoeHnSuQ29GeGjYE2cRWjUd7h7mPXBjdOiqpvNSP-0p3NPXb0cczYaU6PwY5ERII-CNk8qb1vD3rgfd884EGsv5xYettxTVUvxk93mW3YNHjkfuLs98BJQxkiY_Nkvfn6b_G8bXUSoBFqBKBXrYPBJJSJMenhlwhmt4LoGI3fNchLu1BxfLAsvAirTTEkGubOWpQEekSL3WrDW0iKDWHM-ayXdTBttCuPSrAz4kow6kSSLlrh9N6p9LMU",
    winningBidUsdc: "3,612.50 USDC",
    closingDate: "Oct 24, 2024",
    explorerHref: "#",
  },
  {
    assetName: "Mewtwo GX Rare",
    assetSubtitle: "Liquidated 4.2 ETH worth",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDW5OdDGakIOoKA4n0EulRi3pTI9CuSnciDaidYBUr_8gv-lkQMfCepjiPfYlC17cyV7v-6_qrxCynd5BwCvmWuWWwLMYUO5tL9-QePzg40O3krHcrCYw2fzBpqlrmivRhezJSVgFbR1Ssy3A77P-bcnqqxAUtdX19myYKVKXrgooaYEEvHm6mZl-96rrOZUTGgHPUM35js8Vve4mWilvaqckktAmtLmkGvTpFF2xipctwQ6ALVdM-9FKeMvbmlLI9vvPLulYscZQs",
    winningBidUsdc: "1,088.00 USDC",
    closingDate: "Oct 22, 2024",
    explorerHref: "#",
  },
  {
    assetName: "Pikachu VMAX",
    assetSubtitle: "Liquidated 2.8 ETH worth",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOdIBPndMYGKANf-C5OidcZiJ-GSbNiJMIyhZDPE3Sl7EhLsBAlQDeoAHGJvg5ra8LGZBl4er560j0bTOEvo_oo9Iq6h2pvyR02DpNXnLim1OQeOfeWYfsE0UkiR1wzA7VcxmnONuX1rX9t28n7rTW88tQhdc61LStnR9qrdMJ4XhYlVZUOoLLQtjFk5vP1CTFEE63qN8hXCwCwE_e2of3j8i3DuYZLJbATQHXAZY-59duUrQw8dH58pV8xYVAUN1gflSVcj0E-s4",
    winningBidUsdc: "715.70 USDC",
    closingDate: "Oct 20, 2024",
    explorerHref: "#",
  },
];
