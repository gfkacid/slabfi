# Slab.Finance

## Unlock liquidity for tokenized collectibles—without selling your NFTs.

**Speaker notes**

- Slab.Finance is a lending protocol for tokenized real-world collectibles (e.g. trading cards represented as NFTs).
- One sentence: you keep the asset on-chain as collateral and borrow stablecoins against it.

---

## The problem

**Speaker notes**

- Collectibles are increasingly **tokenized**, but that liquidity is mostly **passive**: holders either sit on inventory or **sell** to access cash.
- Selling means friction, potential loss of upside, and no simple way to **borrow** against a specific graded item the way you might with traditional collateral.
- **Goal:** make those assets **productive**—same NFT, but usable as loan collateral.

---

## What we built

**Speaker notes**

- **Slab.Finance**: borrow **USDC** against locked collectible NFTs.
- **Cross-chain by design**: collateral can live on **EVM** networks (**Polygon**, **Base**, …) while lending and accounting run on a **Solana** hub program (`slab_hub`), connected by **LayerZero V2**.
- Targets collectors, marketplaces, and anyone holding **tokenized** inventory who wants **liquidity** without listing or selling.

---

## How it works (user journey)

1. **Lock** — Escrow your NFT in a vault on the source chain; the adapter sends a **LayerZero** message to the Solana hub.
2. **Borrow** — On Solana, borrow USDC up to a **loan-to-value** limit based on **oracle** pricing and asset **tier**.
3. **Repay** — Pay back USDC; interest accrues on the open position.
4. **Unlock** — When the loan is fully repaid, complete the unlock path (including LZ delivery back to the source chain) so the NFT returns to your wallet.

**Speaker notes**

- Judges hear “DeFi lending” a lot—our twist is **NFT collectibles** + **cross-chain messaging** so the asset stays where it was issued while liquidity lives on the hub.

---

## Architecture & risk controls

**Hub (Solana mainnet-beta)** — Anchor program: lending pool, collateral registry, oracle, health factor, liquidation.

**Source (EVM)** — `NFTVault` + `CollateralAdapterLayerZero` per chain; only configured adapters can notify the hub.

**LayerZero V2** — OApp payloads between each source chain and the Solana destination endpoint id (**30168** in config).

**Risk** — Positions use a **health factor** (healthy / warning / liquidatable). If undercollateralized, liquidation flows (per program specs) protect lenders.

**Speaker notes**

- Oracle path is **hub-specific** (signed updates / program rules). Say clearly if a demo uses **mock** prices.

---

## Demo & stack (optional closing slide)

**Live demo idea** — Connect wallets → lock NFT on **Polygon** or **Base** → borrow USDC on **Solana** → dashboard → repay → unlock.

**Stack** — Anchor (Rust), Solidity / Foundry, LayerZero, Vite + React, indexer + API.

**Speaker notes**

- Close with what you want from judges: feedback, partnerships, or “this is the foundation for collectible-backed credit.”

---

## Thank you

**Slab.Finance** — Questions?

**Speaker notes**

- Team names, contact, repo / demo link.
