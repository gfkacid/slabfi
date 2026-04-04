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
- **Cross-chain by design**: collateral is secured on one network; lending and accounting happen on a **hub** chain—here demo’d on **Ethereum Sepolia** (lock) and **Arc Testnet** (borrow), connected by **Chainlink CCIP**.
- Targets collectors, marketplaces, and anyone holding **tokenized** inventory who wants **liquidity** without listing or selling.

---

## How it works (user journey)

1. **Lock** — Escrow your NFT in a vault on the source chain; the protocol notifies the hub via CCIP.
2. **Borrow** — On the hub, borrow USDC up to a **loan-to-value** limit based on **oracle** pricing and asset **tier**.
3. **Repay** — Pay back USDC; interest accrues on the open position (demo uses a fixed APR).
4. **Unlock** — When the loan is fully repaid, the hub sends an unlock message; the NFT returns to your wallet.

**Speaker notes**

- Judges hear “DeFi lending” a lot—our twist is **NFT collectibles** + **cross-chain messaging** so the asset stays where it was issued while liquidity lives on the hub.

---

## Architecture & risk controls

**Hub (Arc Testnet)** — USDC lending pool, collateral registry, oracle consumer, health factor engine, liquidation flow.

**Source (Ethereum Sepolia)** — NFT vault and collateral adapter; only trusted adapters can notify the hub.

**Chainlink CCIP** — `LOCK_NOTICE` (source → hub) and `UNLOCK_COMMAND` (hub → source) keep the two chains in sync.

**Risk** — Positions use a **health factor** (healthy / warning / liquidatable). If undercollateralized, a **liquidation queue** gives time to cure before execution; liquidators are incentivized to repay debt and receive collateral.

**Speaker notes**

- Oracle path uses **Chainlink CRE** in a production-minded setup; hackathon/demo may use **mock prices**—worth saying honestly if you demo mocks.

---

## Demo & stack (optional closing slide)

**Live demo idea** — Connect wallet → lock demo NFT on Sepolia → borrow USDC on Arc → show dashboard (health, position) → repay partial/full → unlock.

**Stack** — Solidity / Foundry, CCIP, Vite + React frontend, indexer + API for reads (as in repo).

**Speaker notes**

- Close with what you want from judges: feedback, partnerships, or “this is the foundation for collectible-backed credit.”

---

## Thank you

**Slab.Finance** — Questions?

**Speaker notes**

- Team names, contact, repo / demo link.
