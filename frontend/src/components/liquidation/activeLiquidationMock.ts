/** Stitch MCP reference rows — shown when the on-chain active queue is empty. */
export type ActiveQueueMockRow = {
  id: string;
  assetName: string;
  vaultLabel: string;
  imageUrl: string;
  debtUsdc: string;
  healthFactor: string;
  healthPulse: boolean;
  timeLabel: string;
  bidUsdc: string;
};

export const ACTIVE_QUEUE_MOCK_ROWS: readonly ActiveQueueMockRow[] = [
  {
    id: "mock-charizard",
    assetName: "Charizard 1st Ed.",
    vaultLabel: "0x71C...4e8B",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuChj0elKlYGIwr6foHsejuoeHnSuQ29GeGjYE2cRWjUd7h7mPXBjdOiqpvNSP-0p3NPXb0cczYaU6PwY5ERII-CNk8qb1vD3rgfd884EGsv5xYettxTVUvxk93mW3YNHjkfuLs98BJQxkiY_Nkvfn6b_G8bXUSoBFqBKBXrYPBJJSJMenhlwhmt4LoGI3fNchLu1BxfLAsvAirTTEkGubOWpQEekSL3WrDW0iKDWHM-ayXdTBttCuPSrAz4kow6kSSLlrh9N6p9LMU",
    debtUsdc: "42,500.00 USDC",
    healthFactor: "0.92",
    healthPulse: true,
    timeLabel: "05h 42m 12s",
    bidUsdc: "38,100.00 USDC",
  },
  {
    id: "mock-mewtwo",
    assetName: "Mewtwo GX Rare",
    vaultLabel: "0x3A2...92f1",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDW5OdDGakIOoKA4n0EulRi3pTI9CuSnciDaidYBUr_8gv-lkQMfCepjiPfYlC17cyV7v-6_qrxCynd5BwCvmWuWWwLMYUO5tL9-QePzg40O3krHcrCYw2fzBpqlrmivRhezJSVgFbR1Ssy3A77P-bcnqqxAUtdX19myYKVKXrgooaYEEvHm6mZl-96rrOZUTGgHPUM35js8Vve4mWilvaqckktAmtLmkGvTpFF2xipctwQ6ALVdM-9FKeMvbmlLI9vvPLulYscZQs",
    debtUsdc: "12,800.00 USDC",
    healthFactor: "0.88",
    healthPulse: false,
    timeLabel: "02h 15m 04s",
    bidUsdc: "11,200.00 USDC",
  },
  {
    id: "mock-pikachu",
    assetName: "Pikachu VMAX",
    vaultLabel: "0x981...11a2",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOdIBPndMYGKANf-C5OidcZiJ-GSbNiJMIyhZDPE3Sl7EhLsBAlQDeoAHGJvg5ra8LGZBl4er560j0bTOEvo_oo9Iq6h2pvyR02DpNXnLim1OQeOfeWYfsE0UkiR1wzA7VcxmnONuX1rX9t28n7rTW88tQhdc61LStnR9qrdMJ4XhYlVZUOoLLQtjFk5vP1CTFEE63qN8hXCwCwE_e2of3j8i3DuYZLJbATQHXAZY-59duUrQw8dH58pV8xYVAUN1gflSVcj0E-s4",
    debtUsdc: "8,420.00 USDC",
    healthFactor: "0.96",
    healthPulse: false,
    timeLabel: "08h 59m 59s",
    bidUsdc: "7,950.00 USDC",
  },
];
