# Slab Finance — Whitepaper

**Version:** 1.0.0-draft
**Date:** April 2026

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
   - 2.1 [The Collectibles Market Opportunity](#21-the-collectibles-market-opportunity)
   - 2.2 [The Liquidity Gap](#22-the-liquidity-gap)
   - 2.3 [Design Thesis](#23-design-thesis)
3. [Protocol Overview](#3-protocol-overview)
   - 3.1 [User Journey](#31-user-journey)
   - 3.2 [Participants and Roles](#32-participants-and-roles)
4. [System Architecture](#4-system-architecture)
   - 4.1 [Hub-and-Spoke Topology](#41-hub-and-spoke-topology)
   - 4.2 [Cross-Chain Messaging (LayerZero V2)](#42-cross-chain-messaging-layerzero-v2)
   - 4.3 [Adding a New Source Chain](#43-adding-a-new-source-chain)
   - 4.4 [Program Upgradeability](#44-program-upgradeability)
5. [Lending Pool Mechanics](#5-lending-pool-mechanics)
   - 5.1 [USDC Vault (Share-Based Accounting)](#51-usdc-vault-share-based-accounting)
   - 5.2 [Interest Rate Model (Utilization Kink)](#52-interest-rate-model-utilization-kink)
   - 5.3 [Protocol Fee and Reserve Factor](#53-protocol-fee-and-reserve-factor)
   - 5.4 [Loan Modes: Cross-Collateralized vs. Isolated](#54-loan-modes-cross-collateralized-vs-isolated)
6. [Collateral and Oracle System](#6-collateral-and-oracle-system)
   - 6.1 [Collateral Registry and Lifecycle](#61-collateral-registry-and-lifecycle)
   - 6.2 [Oracle Design](#62-oracle-design)
   - 6.3 [Tiered LTV Framework](#63-tiered-ltv-framework)
   - 6.4 [Liquidity-Weighted Volatility-Adjusted LTV](#64-liquidity-weighted-volatility-adjusted-ltv)
7. [Health Factor and Liquidation](#7-health-factor-and-liquidation)
   - 7.1 [Health Factor Computation](#71-health-factor-computation)
   - 7.2 [Per-Card USDC Auctions](#72-per-card-usdc-auctions)
   - 7.3 [Borrower Cure Window](#73-borrower-cure-window)
8. [Security Considerations](#8-security-considerations)
   - 8.1 [Smart Contract Security](#81-smart-contract-security)
   - 8.2 [Oracle Risk](#82-oracle-risk)
   - 8.3 [Cross-Chain Risk](#83-cross-chain-risk)
   - 8.4 [Economic Risk](#84-economic-risk)
   - 8.5 [Audit Status](#85-audit-status)
9. [Governance and Roadmap](#9-governance-and-roadmap)
   - 9.1 [Current Admin Model](#91-current-admin-model)
   - 9.2 [Progressive Decentralization](#92-progressive-decentralization)
   - 9.3 [Feature Roadmap](#93-feature-roadmap)
10. [Conclusion](#10-conclusion)
11. [Appendices](#11-appendices)
    - A. [Contract Addresses and Deployment Map](#a-contract-addresses-and-deployment-map)
    - B. [Interest Rate Model Derivation](#b-interest-rate-model-derivation)
    - C. [Liquidation Auction Worked Example](#c-liquidation-auction-worked-example)
    - D. [Glossary](#d-glossary)

---

## 1. Abstract

Tokenized real-world collectibles — graded trading cards, sports memorabilia, rare art — represent a growing class of on-chain assets. Yet holders today face a binary choice: sit on inventory or sell to access cash. No infrastructure exists to borrow against these assets the way traditional finance treats equities or real estate.

Slab Finance is a cross-chain lending protocol that lets holders of tokenized collectible NFTs borrow USDC without selling. Collateral may reside on any supported EVM chain (Polygon, Base, and beyond) while lending, accounting, and settlement run on a Solana hub program connected via LayerZero V2 messaging. The protocol employs a tiered, liquidity-weighted LTV framework purpose-built for assets that price infrequently and trade in thin markets, a utilization-based interest rate model that dynamically balances borrower demand with lender yield, and a per-card auction liquidation engine that protects lenders while giving borrowers a cure window to avoid forced sales.

This paper describes the protocol architecture, lending mechanics, oracle and risk systems, and the path toward progressive decentralization.

---

## 2. Introduction

### 2.1 The Collectibles Market Opportunity

The global collectibles market — trading cards, coins, stamps, sports memorabilia, fine art — is valued in the hundreds of billions of dollars. A significant and accelerating fraction of this market is being tokenized: companies like Courtyard (graded cards on Polygon) and Beezie (sports collectibles on Base) vault physical items in insured custody and issue ERC-721 NFTs representing verifiable ownership.

This tokenization wave solves provenance, custody, and transferability — but it does not solve *capital efficiency*. The vast majority of tokenized collectibles sit idle in wallets, contributing nothing to their owner's financial position beyond potential future resale.

### 2.2 The Liquidity Gap

Holders of tokenized collectibles who need cash today have exactly one option: sell. This creates several problems:

- **Forced exits at bad prices.** Collectibles are illiquid; selling into a thin market means price impact and potential loss of upside.
- **Tax events.** A sale realizes capital gains. A loan does not.
- **Loss of the asset.** Collectors who sell lose items they may never be able to reacquire at the same grade and provenance.

Existing NFT lending protocols (Blur/Blend, BendDAO, NFTfi) target PFP and art collections with floor-price models. These are fundamentally unsuited for tokenized collectibles, where each item has a unique grade, provenance, and market value — the concept of a "floor price" is meaningless for a PSA 10 1952 Topps Mickey Mantle versus a PSA 7 of the same card.

### 2.3 Design Thesis

Slab Finance is built on three principles:

**Make collectibles productive.** The same NFT, still in the owner's custody (escrowed, not sold), becomes collateral for a USDC loan. The holder keeps upside exposure and reclaims the asset upon repayment.

**Cross-chain by design.** Tokenized collectibles are minted wherever their tokenization partner operates — Polygon, Base, Solana, and chains yet to launch. Forcing users onto a single chain to borrow is a non-starter. Slab Finance uses a hub-and-spoke architecture: collateral is locked on its native chain, and a LayerZero V2 message registers it on the Solana hub where lending and accounting run at low cost and high throughput.

**Oracle conservatism.** Collectible prices update daily at best, not per-block. The protocol is engineered for safety under stale data: conservative tiered LTVs, liquidity-weighted volatility haircuts, a grace period before staleness reverts, and a two-zone health factor model with a warning buffer between healthy and liquidatable states.

---

## 3. Protocol Overview

### 3.1 User Journey

The Slab Finance lifecycle has four stages:

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│  LOCK   │────▶│  BORROW  │────▶│  REPAY  │────▶│  UNLOCK  │
└─────────┘     └──────────┘     └─────────┘     └──────────┘
```

1. **Lock.** The borrower escrows their collectible NFT on the source chain (e.g., Polygon). The adapter contract sends a LayerZero message to the Solana hub, which registers the collateral as `PENDING`. Once the oracle prices the item, the collateral becomes `ACTIVE`.

2. **Borrow.** On Solana, the borrower draws USDC up to a loan-to-value limit determined by the oracle price and the asset's tier. Interest begins accruing immediately at the prevailing variable rate.

3. **Repay.** The borrower repays USDC (principal plus accrued interest) to the lending pool on Solana. Partial repayments reduce outstanding debt and improve the health factor.

4. **Unlock.** Once the loan is fully repaid (zero outstanding debt), the borrower initiates an unlock. A LayerZero message is sent back to the source chain, and the NFT vault releases the asset to the borrower's wallet.

### 3.2 Participants and Roles

| Participant | Role |
|---|---|
| **Borrower** | Locks collectible NFTs as collateral and borrows USDC. Responsible for maintaining a healthy position and repaying loans. |
| **Liquidity provider (LP)** | Deposits USDC into the lending pool and receives vault shares representing a pro-rata claim on pool assets. Earns yield from borrower interest payments. |
| **Liquidator** | Bids in per-card USDC auctions when a borrower's health factor drops below 1.0. Earns a discount on collateral. |
| **Oracle operator** | Submits attested price updates for each `(collection, tokenId)` pair to the Solana hub. Currently a permissioned backend signer; target state is decentralized attestation. |
| **Protocol admin** | Deploys contracts, configures parameters (LTV tiers, rate curves, fee BPS), whitelists new collections, and manages the upgrade authority. Intended to transition to a governance DAO. |

---

## 4. System Architecture

### 4.1 Hub-and-Spoke Topology

Slab Finance uses a **hub-and-spoke** model:

```
┌──────────────────────────────┐     ┌──────────────────────────────┐
│   Polygon (Courtyard)        │     │   Base (Beezie)              │
│   NFTVault + Adapter (LZ)    │     │   NFTVault + Adapter (LZ)    │
└──────────────┬───────────────┘     └──────────────┬───────────────┘
               │    LayerZero V2                     │
               └────────────────┬────────────────────┘
                                ▼
               ┌────────────────────────────────────┐
               │  Solana mainnet-beta — slab_hub    │
               │  Registry · Pool · Oracle · HF ·   │
               │  Liquidation · NFT Vault (SPL)      │
               └────────────────────────────────────┘
```

**Why Solana as the hub?** Lending operations — deposits, withdrawals, borrows, repayments, health factor checks, liquidation bids — are high-frequency, low-value transactions. Solana's sub-second finality and sub-cent fees make it the natural settlement layer. USDC is natively issued on Solana with deep liquidity, eliminating the need for bridged stablecoin wrappers.

**Why EVM spokes?** Tokenized collectibles are minted where their tokenization partners operate. Courtyard issues on Polygon; Beezie on Base. Rather than forcing users to bridge NFTs to Solana (which would break provenance and complicate custody), Slab Finance escrows them in place and uses cross-chain messaging to register the collateral on the hub.

Each spoke deploys two contracts:

- **`NFTVault`** — Holds escrowed ERC-721 tokens. Only its paired adapter contract may deposit or release NFTs. The adapter address is set once and cannot be changed, ensuring no unauthorized access to escrowed collateral.
- **`CollateralAdapterLayerZero`** — A LayerZero V2 OApp that implements `lockAndNotify` (escrow NFT, send lock message to hub) and `_lzReceive` (decode unlock command, release NFT from vault).

### 4.2 Cross-Chain Messaging (LayerZero V2)

#### Lock path (Source → Hub)

1. Borrower calls `lockAndNotify(tokenId, hubOwner)` on the adapter, paying native gas + LayerZero fee.
2. The adapter transfers the NFT to the vault via `safeTransferFrom`.
3. The adapter computes `collateralId = keccak256(abi.encodePacked(chainSelector, collection, tokenId))` and stores a reverse lookup.
4. The adapter calls `_lzSend` with a `LOCK_NOTICE` payload containing `(chainSelector, collection, tokenId, hubOwner)` to the Solana destination EID (30168).
5. On Solana, the hub program's `receive_cross_chain_lock` instruction validates the router authority signature, checks replay protection (a PDA keyed on the message digest prevents duplicate processing), and creates a `CollateralItem` account.

#### Unlock path (Hub → Source)

1. Borrower calls the unlock instruction on Solana after fully repaying their loan.
2. The hub program verifies zero outstanding debt and marks the collateral as `UNLOCK_SENT`.
3. A LayerZero message carrying `(UNLOCK_COMMAND, collateralId, recipient)` is delivered to the source chain adapter.
4. The adapter's `_lzReceive` decodes the payload, calls `vault.release(collateralId, recipient)`, and the NFT returns to the borrower's wallet.

#### Collateral ID alignment

Both sides must agree on the collateral identifier. The EVM adapter computes `keccak256(abi.encodePacked(uint64, address, uint256))`. The Solana hub mirrors this in Rust using `keccak::hashv` with the same byte layout (8-byte big-endian EID, 20-byte address, 32-byte big-endian token ID). This deterministic binding prevents collateral ID spoofing across chains.

#### Replay protection

The Solana hub initializes a `ReplayEntry` PDA at `[b"replay", message_digest]` for every cross-chain lock. Since Solana account creation is idempotent-or-fail, a second delivery with the same digest will fail to create the PDA and the transaction will revert.

### 4.3 Adding a New Source Chain

The protocol is designed so that adding a new EVM source chain requires no changes to the hub program:

1. Deploy `NFTVault` and `CollateralAdapterLayerZero` on the new chain, configuring the Solana destination EID and LayerZero endpoint.
2. Add the chain's entry to `protocolConfig.evmSources` (chain ID, LZ endpoint ID, contract addresses).
3. Whitelist the new chain's collection(s) on the Solana hub via the `whitelist_collection` instruction.
4. Configure the oracle to begin pricing assets from the new collection.

This adapter pattern means the hub is decoupled from any specific tokenization partner or chain — each integration is an independent deployment.

### 4.4 Program Upgradeability

The Solana hub program (`slab_hub`) is deployed via Anchor under the BPF Upgradeable Loader, which natively supports program upgrades. Unlike EVM proxy patterns (UUPS, Transparent Proxy) that require `delegatecall` indirection and carry storage layout collision risks, Solana's upgrade model swaps the program binary in place while all account data persists separately.

Key properties:

- **Upgrade authority.** A designated keypair (or multisig) controls who may deploy new bytecode to the program address. In production, this is a multisig wallet.
- **No storage migration risk.** Solana accounts are owned by the program but stored independently. Adding new fields to account structs only requires that new accounts allocate additional space; existing accounts remain valid (Anchor's `realloc` can resize if needed).
- **Path to immutability.** The upgrade authority can be irrevocably renounced, making the program immutable. The protocol's roadmap (Section 9) describes a progressive path: upgradeable during early development, authority transferred to governance, and eventually frozen once the protocol matures.

EVM source contracts (`NFTVault`, `CollateralAdapterLayerZero`) are deployed as standard non-upgradeable contracts. Their logic is simple and unlikely to require changes; if a new version is needed, a new adapter is deployed and the hub's whitelist is updated.

---

## 5. Lending Pool Mechanics

### 5.1 USDC Vault (Share-Based Accounting)

The lending pool uses a share-based accounting model similar to ERC-4626 vaults. Liquidity providers deposit USDC and receive vault shares representing their pro-rata claim on total pool assets.

**Deposit.** When a user deposits `amount` USDC:

\[
\text{sharesMinted} = \begin{cases} \text{amount} & \text{if totalShares} = 0 \\ \text{amount} \times \frac{\text{totalShares}}{\text{totalAssets}} & \text{otherwise} \end{cases}
\]

Where `totalAssets = idleUSDC + totalBorrowed` (after interest accrual). Integer division rounds down in favor of the pool.

**Withdraw.** When a user burns `shares`:

\[
\text{assetsOut} = \text{shares} \times \frac{\text{totalAssets}}{\text{totalShares}}
\]

The withdrawal succeeds only if `assetsOut` does not exceed the pool's idle USDC balance. When utilization is high, withdrawals may be partially or fully blocked until borrowers repay or new deposits arrive.

**Share price growth.** As borrowers pay interest, `totalAssets` grows (because `totalBorrowed` includes accrued interest) while `totalShares` remains constant. This causes each share to represent more USDC over time — the mechanism through which LPs earn yield.

### 5.2 Interest Rate Model (Utilization Kink)

Slab Finance uses a two-slope piecewise interest rate model driven by pool utilization. The model incentivizes a target utilization rate: borrowing is cheap when the pool is underused, and becomes expensive as utilization approaches 100%, protecting LP withdrawability.

#### Utilization

\[
U = \frac{\text{totalBorrowed}}{\text{totalAssets}}
\]

Utilization is bounded between 0 and 1 (0% to 100%). It cannot exceed 100% because `totalBorrowed` is always a component of `totalAssets`.

#### Borrow APR

The rate curve has a "kink" at optimal utilization (default 80%), where the slope steepens sharply:

**Below or at the kink** (\(U \leq U_{\text{opt}}\)):

\[
\text{borrowAPR} = \text{baseRate} + \frac{U}{U_{\text{opt}}} \times \text{slope}_1
\]

**Above the kink** (\(U > U_{\text{opt}}\)):

\[
\text{borrowAPR} = \text{baseRate} + \text{slope}_1 + \frac{U - U_{\text{opt}}}{1 - U_{\text{opt}}} \times \text{slope}_2
\]

#### Default parameters

| Parameter | Value | Meaning |
|---|---|---|
| `baseRate` | 2% (200 BPS) | Floor borrow APR at zero utilization |
| `optimalUtilization` | 80% (8000 BPS) | The kink point |
| `slope1` | 10% (1000 BPS) | Borrow APR increase from 0% to kink utilization |
| `slope2` | 150% (15000 BPS) | Borrow APR increase from kink to 100% utilization |
| `protocolFee` | 10% (1000 BPS) | Fraction of borrow interest retained by the protocol |

#### Rate curve walkthrough

The `slope2` value of 150% does not mean utilization exceeds 100%. It is the *rate of change* of the APR curve in the high-utilization zone. As utilization rises from the 80% kink to 100%, the borrow APR climbs an additional 150 percentage points. This creates a steep penalty that discourages borrowers from draining the pool and incentivizes repayment.

| Utilization | Borrow APR | Supply APR (net of 10% protocol fee) |
|---|---|---|
| 0% | 2.0% | 0.0% |
| 40% | 7.0% | 2.5% |
| 80% (kink) | 12.0% | 8.6% |
| 90% | 87.0% | 70.5% |
| 100% | 162.0% | 145.8% |

```
Borrow APR
  │
  │                                                    ╱ 162%
  │                                                  ╱
  │                                                ╱
  │                                              ╱
  │                                            ╱
  │                                          ╱ slope₂ (steep)
  │                                        ╱
  │                                      ╱
  │                          ╱──────────╱ 12% (kink)
  │                    ╱ slope₁ (gentle)
  │              ╱
  │        ╱
  │──╱ 2% (base)
  └──────────────────────────────────────────── Utilization
  0%              40%            80%       100%
```

#### Supply APR

Liquidity providers earn a fraction of the borrow interest, scaled by utilization and net of the protocol fee:

\[
\text{supplyAPR} = \text{borrowAPR} \times U \times \frac{10000 - \text{protocolFeeBPS}}{10000}
\]

When utilization is low, supply APR is modest even if borrow APR is non-trivial — LPs earn yield only on the fraction of the pool that is actually lent out.

#### Interest accrual

Rates are defined as annual figures but accrue per-second on-chain. Before any state-changing operation (deposit, withdraw, borrow, repay), the pool calls an internal `accrue()` function that:

1. Computes elapsed seconds since last accrual.
2. Applies the per-second borrow rate to `totalBorrowed`, increasing it by the accrued interest.
3. Credits the protocol fee share to reserves.
4. Updates `totalAssets` accordingly, so that LP share prices reflect earned interest.

### 5.3 Protocol Fee and Reserve Factor

A configurable fraction of borrow interest (default 10%) is retained by the protocol rather than passed through to LPs. This reserve factor serves two purposes:

1. **Treasury accumulation.** Retained fees fund protocol development, oracle infrastructure costs, and future insurance mechanisms.
2. **Bad debt buffer.** In scenarios where liquidation proceeds fail to cover outstanding debt (e.g., a sharp market gap), protocol reserves can absorb the shortfall before it socializes to LPs.

The protocol fee is applied automatically during interest accrual and requires no separate user action.

### 5.4 Loan Modes: Cross-Collateralized vs. Isolated

Slab Finance supports two borrowing modes, giving users control over risk exposure:

#### Cross-collateralized (portfolio) mode

The default mode. All of a borrower's locked NFTs contribute to a single position with a shared health factor. Debt is pooled across all collateral.

**Advantages:**
- Higher capital efficiency — a single high-value card can support the borrowing power of the whole portfolio.
- Simpler mental model for borrowers with diversified holdings.
- Portfolio diversification naturally smooths health factor volatility.

**Risks:**
- A price decline on *any* card can trigger liquidation of *all* cards in the position.
- No granular control over which assets back which debt.

#### Isolated mode

The borrower creates an independent loan backed by a single collateral item (or a user-selected subset). Each isolated loan has its own debt balance, health factor, and liquidation risk — completely independent of the borrower's other positions.

**Advantages:**
- Liquidation of one position does not affect others.
- Borrowers can isolate high-risk or volatile cards from stable trophy holdings.
- Enables more precise risk management for sophisticated users.

**Tradeoffs:**
- Lower capital efficiency — each card's borrowing power stands alone, with no portfolio benefit.
- Higher on-chain state overhead (one loan account per isolated position).

The protocol implements isolated loans as separate `Loan` accounts, each referencing its own collateral set and tracking independent debt, health factor, and liquidation state. Borrowers choose their mode at loan origination.

---

## 6. Collateral and Oracle System

### 6.1 Collateral Registry and Lifecycle

Every piece of locked collateral is tracked as a `CollateralItem` on the Solana hub, uniquely identified by a deterministic `collateralId` derived from `(sourceChainEID, collectionAddress, tokenId)`.

The collateral lifecycle follows a state machine:

```
PENDING ──▶ ACTIVE ──▶ UNLOCK_SENT ──▶ RELEASED
                │
                └──▶ LIQUIDATED (via auction)
```

| State | Meaning |
|---|---|
| `PENDING` | Lock notice received from source chain; awaiting first oracle price attestation. Cannot contribute to borrowing power. |
| `ACTIVE` | Priced by the oracle and contributing to the borrower's health factor. Eligible as loan collateral. |
| `UNLOCK_SENT` | Borrower has repaid all debt and initiated unlock. A LayerZero message has been dispatched to release the NFT on the source chain. |
| `RELEASED` | NFT has been returned to the owner on the source chain. Terminal state. |
| `LIQUIDATED` | Collateral was seized via a liquidation auction. The NFT is transferred to the auction winner. Terminal state. |

A per-borrower `Position` account aggregates all of the borrower's `ACTIVE` collateral IDs and their debt state, enabling the health factor engine to compute a single HF across the portfolio (in cross-collateralized mode) or per-loan (in isolated mode).

### 6.2 Oracle Design

Collectible pricing is fundamentally different from fungible token pricing. There is no continuous AMM price feed, no TWAP, and no liquid order book. A PSA 10 vintage card may trade a few times per month — or less. The oracle system is designed for this reality.

#### Current implementation

The Solana hub uses a **permissioned oracle authority** — a backend signer that fetches prices from an external pricing API (wrapping sources such as PriceCharting, Courtyard market data, or TCGPlayer aggregates), applies policy and sanity checks, and submits `oracle_set_price` transactions to the hub program.

Each price attestation stores:
- `price_usd_8d` — USD price with 8 decimal places (e.g., `15000000000` = $150.00).
- `tier` — Liquidity tier (1, 2, or 3), determining the base LTV.
- `updated_ts` — Timestamp of the attestation.

Prices are stored per `(collection, tokenId)` in individual PDA accounts, enabling the hub program to read them during borrow, health factor refresh, and liquidation operations.

#### Freshness and staleness

| Price age | Behavior |
|---|---|
| < 24 hours | Normal — full LTV applied |
| 24–26 hours (grace period) | LTV reduced by 50% as a staleness penalty |
| > 26 hours | Price is considered stale; new borrows blocked for this collateral item; existing debt continues accruing |

A position with stale-priced collateral contributes zero to the borrower's weighted collateral value for the purpose of new borrows, but existing debt continues to accrue. The borrower must repay or wait for the next price update.

#### Target state

The long-term goal is to decentralize price attestation by aggregating multiple independent data sources — marketplace sales, auction results, dealer quotes — through a decentralized oracle network (Switchboard, Pyth custom feeds, or a dedicated attestation committee). The permissioned model is an explicit bootstrapping choice, documented and intended to be replaced.

### 6.3 Tiered LTV Framework

Not all collectibles carry the same risk. A frequently traded flagship card with deep market demand is fundamentally safer collateral than a niche item that trades once a year. The tiered LTV framework reflects this:

| Tier | Description | Base LTV | Example |
|---|---|---|---|
| 1 | High liquidity — flagship cards with frequent sales, well-established market prices | 50% | PSA 10 vintage Pokémon holos, iconic sports rookie cards |
| 2 | Medium liquidity — recognizable items with moderate trade frequency | 35% | Mid-grade vintage cards, popular modern releases |
| 3 | Illiquid / long-tail — items with sparse sales history or thin markets | 20% | Niche sets, low-grade vintage, new/unproven collectible classes |

Tier assignment is set by the oracle operator (currently admin-controlled) based on market data and may be adjusted as a collection's liquidity profile changes over time. The conservative LTV caps — significantly lower than typical DeFi lending protocols — reflect the unique risk profile of collectible assets: illiquid, daily-priced, and subject to sudden sentiment shifts.

### 6.4 Liquidity-Weighted Volatility-Adjusted LTV

The static tier-based LTV provides a baseline, but two cards in the same tier can have very different risk profiles. A card that trades daily at stable prices is safer collateral than one with the same tier but high price swings or no recent sales at all. The protocol applies a dynamic adjustment based on two factors:

#### Volatility component

After 30 days of price history have accumulated for a `(collection, tokenId)` pair, the effective LTV is reduced by the asset's recent price volatility:

\[
\sigma_{30d} = \frac{\text{stddev}(\text{dailyPrices}_{[-30:]})}{\text{mean}(\text{dailyPrices}_{[-30:]})}
\]

This is the coefficient of variation (normalized standard deviation) of the last 30 daily price observations, stored in a circular buffer on-chain.

#### Liquidity component

Price volatility alone is insufficient — a card with *zero* volatility because it *never trades* is actually higher risk, since forced liquidation into a market with no buyers will suffer severe price impact. The liquidity factor accounts for this:

\[
\lambda = \min\left(1,\ \frac{\text{salesCount}_{90d}}{S_{\text{target}}}\right)
\]

Where `salesCount_90d` is the number of recorded sales for this card (or comparable cards in its collection/grade cohort) over the trailing 90 days, and `S_target` is a configurable threshold representing "adequate liquidity" (e.g., 10 sales per 90 days). Cards with fewer sales than the target receive a proportional haircut.

#### Combined effective LTV

\[
\text{effectiveLTV} = \max\left(\text{baseLTV}_{\text{tier}} \times (1 - \sigma_{30d}) \times \lambda,\ \text{MIN\_LTV}\right)
\]

The minimum LTV floor (default 5%) prevents the effective LTV from reaching zero, which would make the collateral permanently unborrrowable.

**Example:** A tier 1 card (base LTV 50%) with 18% price volatility and 6 sales in the last 90 days (target: 10):

\[
\text{effectiveLTV} = \max(50\% \times (1 - 0.18) \times 0.6,\ 5\%) = \max(24.6\%,\ 5\%) = 24.6\%
\]

**Bootstrap period:** For the first 30 days of a collection's price history, the full base tier LTV applies without volatility or liquidity adjustments. New collections should be onboarded at conservative tiers (tier 2 or 3) until sufficient history accumulates.

---

## 7. Health Factor and Liquidation

### 7.1 Health Factor Computation

The health factor (HF) measures the safety margin of a borrower's position. It is the ratio of the borrower's weighted collateral value to their total outstanding debt:

\[
\text{HF} = \frac{\sum_{i} \left( \text{price}_i \times \text{effectiveLTV}_i \right)}{\text{totalDebt}}
\]

Where:
- \(\text{price}_i\) is the latest oracle price for collateral item *i* (must be within the freshness window).
- \(\text{effectiveLTV}_i\) is the liquidity-weighted volatility-adjusted LTV for item *i* (see Section 6.4).
- \(\text{totalDebt}\) is the borrower's outstanding principal plus accrued interest.

The health factor determines the position's status zone:

| Zone | Condition | Behavior |
|---|---|---|
| **Healthy** | HF >= 1.30 | Normal operation. Borrower may take additional loans up to available credit. |
| **Warning** | 1.00 <= HF < 1.30 | New borrows disabled. The frontend displays a warning and encourages repayment. The buffer exists because daily-priced assets can gap down significantly between oracle updates. |
| **Liquidatable** | HF < 1.00 | The position is undercollateralized. Per-card liquidation auctions are queued for each `ACTIVE` collateral item. |

### 7.2 Per-Card USDC Auctions

When a borrower's health factor drops below 1.0, each of their `ACTIVE` collateral NFTs is queued as an independent liquidation auction. This per-card approach — rather than liquidating the entire position at once — provides granularity and allows partial cures.

#### Debt share and reserve price

At queue time, each card's share of the borrower's total debt is computed proportional to its borrowing power contribution:

\[
\text{cardDebtShare}_i = \text{totalDebt} \times \frac{\text{price}_i \times \text{effectiveLTV}_i}{\sum_j \text{price}_j \times \text{effectiveLTV}_j}
\]

The reserve price (minimum first bid) is the debt share plus a liquidation fee:

\[
\text{reservePrice} = \text{cardDebtShare} + \text{cardDebtShare} \times \frac{\text{liquidationFeeBPS}}{10000}
\]

The default liquidation fee is 5% of the debt share, not of the bid amount.

#### Bidding rules

| Rule | Definition |
|---|---|
| First bid | Must be >= reserve price |
| Subsequent bids | Must exceed the current highest bid by at least `minBidIncrementBPS` (default 1%) |
| USDC handling | Bids are non-withdrawable; USDC is pulled from the bidder via `transferFrom` |
| Re-bidding | A previously outbid user raising their bid only pays the difference between their new bid and their existing deposit |

#### Anti-sniping mechanism

To prevent last-second bid sniping:
- If a bid is placed when the remaining time is less than or equal to the anti-sniping window (default 5 minutes), the auction deadline is extended to `currentTime + antiSnipingWindow`.
- If no bids are placed before the initial deadline, the auction remains open indefinitely until a first bid is placed (after which the anti-sniping window applies).

#### Settlement

After the auction deadline, anyone may call `claim` to settle:

| Recipient | Amount |
|---|---|
| **Lending Pool** (debt repayment) | `debtShareSnapshot` |
| **Treasury** (liquidation fee) | `debtShareSnapshot * liquidationFeeBPS / 10000` |
| **Vault + Treasury** (excess, if bid > debt + fee) | Split per `surplusShareBPS` (default 50/50) |
| **Losing bidders** | Full refund of deposited USDC |

The winning bidder receives the NFT (via a cross-chain unlock message to the source chain, or direct SPL transfer for Solana-native collateral).

#### Configurable parameters

All auction parameters are tunable by the protocol admin:

| Parameter | Default | Description |
|---|---|---|
| `auctionDuration` | 24 hours | Initial auction window |
| `minBidIncrementBPS` | 100 (1%) | Minimum bid step |
| `liquidationFeeBPS` | 500 (5%) | Fee on debt share, sent to treasury |
| `antiSnipingWindow` | 5 minutes | Deadline extension on late bids |
| `surplusShareBPS` | 5000 (50%) | Vault's share of excess proceeds; remainder goes to treasury |

### 7.3 Borrower Cure Window

While auctions are open, the borrower may repay debt or add additional collateral to restore their health factor to >= 1.0. If the health factor returns to the `HEALTHY` or `WARNING` zone:

- All pending auctions for that borrower are cancelled.
- All bidders receive a full refund of their deposited USDC.
- Collateral remains `ACTIVE` and the borrower's position continues normally.

This cure mechanism is a critical borrower protection. It prevents unnecessary liquidation when a temporary price dip triggers an auction but the borrower is able to respond within the auction window.

---

## 8. Security Considerations

### 8.1 Smart Contract Security

#### Separation of privileges

The Solana hub program enforces three distinct authority roles, each with a narrow scope:

| Role | Scope | Rationale |
|---|---|---|
| `admin` | Pool initialization, collection whitelisting, liquidation auction start, parameter changes | Broad but non-financial; cannot move funds directly |
| `oracle_authority` | Price attestations only | Compromise cannot drain the pool; can only affect LTV calculations (mitigated by tier caps) |
| `router_authority` | Cross-chain lock registration only | Cannot create debt or move USDC; can only register new collateral items |

No single key can unilaterally borrow, withdraw pool funds, or seize collateral. Financial operations (borrow, repay, deposit, withdraw) are user-signed and permissionless.

#### Escrow security

Pool USDC is held in a PDA-controlled token account (`vault_authority`). The program signs transfers via PDA seeds — there is no externally owned account (EOA) that holds pool funds. NFT escrows on Solana use the same PDA pattern. On EVM, the `NFTVault` contract holds escrowed NFTs and only accepts deposit/release calls from its adapter (set once via `setAdapter`, which reverts if an adapter is already configured).

#### Collection whitelisting

Only NFTs from explicitly whitelisted collections can be locked as collateral. This prevents attackers from locking worthless or manipulated NFTs and borrowing against them. Whitelisting is admin-gated and requires a separate transaction per collection.

#### Replay protection

Cross-chain lock messages are protected by a digest-based replay guard. Each message produces a unique `ReplayEntry` PDA; duplicate processing is structurally impossible because PDA creation is idempotent-or-fail on Solana.

### 8.2 Oracle Risk

The permissioned oracle is the protocol's primary trust assumption and its most significant centralization risk.

**Mitigations:**
- **Tier-based LTV caps** limit maximum exposure regardless of oracle price. Even if the oracle attests an inflated price, the 50% LTV cap (tier 1) means the protocol's exposure is at most half the attested value.
- **Staleness enforcement** prevents stale prices from being used for new borrows. The 26-hour freshness window with a grace period haircut ensures that pricing data is recent.
- **Planned decentralization** (Section 9) will replace the single oracle signer with multi-source attestation.

**Residual risks:**
- A compromised oracle key could submit artificially high prices, enabling over-borrowing. The blast radius is limited by per-tier LTV caps and total pool liquidity.
- A compromised oracle key could submit artificially low prices, triggering unwarranted liquidations. The borrower cure window (Section 7.3) provides a mitigation period.

### 8.3 Cross-Chain Risk

#### LayerZero trust assumptions

LayerZero V2's security model relies on the configured Decentralized Verifier Networks (DVNs) and executors. The protocol's cross-chain security is bounded by the security of these components. The OApp configures which DVNs must attest to a message before it is considered valid on the destination chain.

#### Message ordering and idempotency

The protocol does not depend on message ordering — each lock/unlock message is independently processable. Idempotency is enforced by the replay guard (Section 8.1). A message that fails on the destination chain can be retried without risk of double-processing.

#### Router authority (current limitation)

The current Solana implementation uses a trusted `router_authority` signer rather than a fully verified LayerZero `lz_receive` CPI path. This means the cross-chain lock registration trusts the router key to submit honest data. The roadmap includes replacing this with a cryptographically verified LayerZero OApp CPI, removing this trust assumption entirely.

### 8.4 Economic Risk

#### Bad debt

If a liquidation auction settles below the outstanding debt (e.g., because the collateral's market value has fallen sharply), the shortfall becomes bad debt. The protocol's defenses against bad debt are layered:

1. **Conservative LTVs** (20–50%) provide a large buffer before a position becomes undercollateralized.
2. **Liquidity-weighted volatility adjustments** further reduce LTV for risky assets.
3. **Protocol reserves** (accumulated from the 10% fee on borrow interest) can absorb bad debt before it impacts LP share prices.
4. **Future insurance fund** — a portion of liquidation fees and surplus proceeds will capitalize a dedicated insurance pool.

#### Utilization spiral

If utilization reaches 100%, all pool USDC is lent out, and LPs cannot withdraw. The steep `slope2` rate curve is the primary defense: at 100% utilization, borrow APR reaches 162%, creating extreme repayment incentive. Additionally, new deposits remain possible at any utilization level, providing a path to unlock liquidity.

#### Liquidity risk for LPs

LP withdrawals are subject to available idle USDC. In high-utilization scenarios, LPs may need to wait for borrower repayments or new deposits. The protocol does not offer guaranteed instant redemption — this is an inherent property of lending pool designs and is clearly communicated in the frontend UI.

### 8.5 Audit Status

The protocol is in active development. A formal security audit by a reputable firm is planned prior to mainnet launch with real user funds. The audit scope will cover the Solana hub program, EVM source contracts, and the cross-chain message flow. Findings and remediations will be published.

---

## 9. Governance and Roadmap

### 9.1 Current Admin Model

During the initial deployment phase, the protocol operates under a multisig-controlled admin model:

- **Hub program upgrade authority:** Multisig wallet controlling program deployments.
- **Admin key:** Manages pool parameters, collection whitelisting, and liquidation triggers.
- **Oracle authority:** Backend signer for price attestations.
- **Router authority:** Backend signer for cross-chain lock registration.

All parameter changes (LTV tiers, rate curve values, fee BPS) are transparent and verifiable on-chain.

### 9.2 Progressive Decentralization

The protocol will decentralize in phases:

**Phase 1 — Managed launch (current).** Admin multisig controls all parameters. The focus is on correctness, user experience, and building a track record of safe operation. The oracle is permissioned and price sources are curated.

**Phase 2 — Governance token and parameter voting.** A governance token is introduced, enabling token holders to vote on parameter changes: LTV tiers, rate curve settings, fee structure, collection whitelisting, and oracle operator selection. The admin multisig retains emergency powers (pause, parameter override) with a timelock.

**Phase 3 — Full DAO.** The admin multisig is dissolved. All protocol parameters, treasury management, and upgrade authority are controlled by on-chain governance. The program upgrade authority may be renounced (making the hub immutable) once the protocol is considered mature and battle-tested.

### 9.3 Feature Roadmap

**Near-term:**
- Trust-minimized LayerZero OApp CPI on Solana, replacing the router authority with cryptographically verified cross-chain message delivery.
- Full on-chain interest accrual engine with compound interest and borrow index tracking.
- Complete liquidation auction settlement with USDC transfers, debt clearing, and cross-chain NFT delivery to auction winners.

**Medium-term:**
- Decentralized oracle integration via multi-source attestation (Switchboard custom feeds, marketplace data aggregation, or an attestation committee).
- Additional source chains and tokenization partners (Ronin, Arbitrum, new collectible verticals).
- Insurance / risk fund capitalized by liquidation fees and protocol reserves.
- On-chain health factor engine with automated position sweeps.

**Long-term:**
- Governance token launch and progressive decentralization (Phase 2 and 3 above).
- Mobile app and embedded wallet experience for non-crypto-native collectors.
- Expansion beyond trading cards to other tokenized real-world assets (watches, wine, sneakers) as collateral classes.
- Secondary market for loan positions and vault shares.

---

## 10. Conclusion

Slab Finance addresses a clear market gap: tokenized collectibles are increasingly common but remain financially inert. Holders cannot borrow against them, stake them, or use them as productive capital — they can only hold or sell.

By combining a Solana-native lending hub with cross-chain collateral escrow via LayerZero V2, Slab Finance lets collectors unlock USDC liquidity from their NFT holdings without selling. The protocol's design is purpose-built for the unique challenges of collectible assets: a tiered LTV framework with liquidity-weighted volatility adjustments for assets that don't have continuous price feeds, a per-card auction liquidation system with borrower cure windows, and a utilization-based interest rate model that dynamically balances borrower demand with lender protection.

The path forward is progressive decentralization — from a managed launch with permissioned oracle and admin keys, through governance token-based parameter voting, to a fully autonomous DAO. The architecture is extensible: new chains, new tokenization partners, and new asset classes can be onboarded without modifying the hub program.

Slab Finance turns passive collectible holdings into productive collateral. The same NFT, the same wallet, but now with liquidity attached.

---

## 11. Appendices

### A. Contract Addresses and Deployment Map

| Component | Chain | Identifier |
|---|---|---|
| `slab_hub` | Solana mainnet-beta | Program ID in `protocolConfig.hub.programs.slabHub` |
| `NFTVault` | Polygon | Per `protocolConfig.evmSources.polygon.contracts.nftVault` |
| `CollateralAdapterLayerZero` | Polygon | Per `protocolConfig.evmSources.polygon.contracts.collateralAdapterLayerZero` |
| `NFTVault` | Base | Per `protocolConfig.evmSources.base.contracts.nftVault` |
| `CollateralAdapterLayerZero` | Base | Per `protocolConfig.evmSources.base.contracts.collateralAdapterLayerZero` |
| USDC (SPL) | Solana | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| LayerZero Solana EID | — | 30168 |
| LayerZero Polygon EID | — | 30109 |
| LayerZero Base EID | — | 30184 |

Live contract addresses are maintained in `shared/config/protocol.ts` and synchronized from deployment artifacts via `pnpm sync:protocol`.

### B. Interest Rate Model Derivation

#### Per-second rate conversion

On-chain accrual uses per-second rates derived from annual BPS:

\[
r_{\text{second}} = \frac{\text{annualBPS}}{10000 \times 365.25 \times 86400}
\]

#### Accrual formula

At each accrual checkpoint (elapsed time \(\Delta t\) seconds since last accrual):

\[
\text{accruedInterest} = \text{totalBorrowed} \times r_{\text{second}} \times \Delta t
\]

\[
\text{protocolShare} = \text{accruedInterest} \times \frac{\text{protocolFeeBPS}}{10000}
\]

\[
\text{totalBorrowed}_{\text{new}} = \text{totalBorrowed} + \text{accruedInterest}
\]

\[
\text{totalReserves}_{\text{new}} = \text{totalReserves} + \text{protocolShare}
\]

LP share price increases because `totalAssets` (which includes `totalBorrowed`) grows with each accrual, while `totalShares` remains constant.

#### Worked example

Pool state: 1,000,000 USDC deposited, 600,000 USDC borrowed (60% utilization).

\[
U = \frac{600{,}000}{1{,}000{,}000} = 0.60
\]

Since \(U < U_{\text{opt}} = 0.80\):

\[
\text{borrowAPR} = 2\% + \frac{0.60}{0.80} \times 10\% = 2\% + 7.5\% = 9.5\%
\]

\[
\text{supplyAPR} = 9.5\% \times 0.60 \times (1 - 0.10) = 5.13\%
\]

Annual interest on 600,000 USDC at 9.5%: 57,000 USDC. Of this, 5,700 USDC (10%) goes to protocol reserves, and 51,300 USDC accrues to LPs — yielding 5.13% on their 1,000,000 USDC.

### C. Liquidation Auction Worked Example

**Setup:** A borrower has two locked cards and 5,000 USDC of outstanding debt.

| Card | Oracle price | Tier | Effective LTV | Weighted value |
|---|---|---|---|---|
| Card A | $8,000 | 1 | 45% | $3,600 |
| Card B | $4,000 | 2 | 30% | $1,200 |
| **Total** | | | | **$4,800** |

Health factor: \(\frac{4{,}800}{5{,}000} = 0.96\) — **Liquidatable**.

#### Auction queuing

Both cards are queued as independent auctions:

**Card A:**
- Debt share: \(5{,}000 \times \frac{3{,}600}{4{,}800} = 3{,}750\) USDC
- Reserve price: \(3{,}750 \times 1.05 = 3{,}937.50\) USDC

**Card B:**
- Debt share: \(5{,}000 \times \frac{1{,}200}{4{,}800} = 1{,}250\) USDC
- Reserve price: \(1{,}250 \times 1.05 = 1{,}312.50\) USDC

#### Card A auction settlement

A liquidator bids 4,500 USDC (above reserve). After the deadline:

| Distribution | Amount |
|---|---|
| Debt repayment to lending pool | 3,750.00 USDC |
| Liquidation fee (5%) to treasury | 187.50 USDC |
| Excess (4,500 - 3,750 - 187.50 = 562.50) | Split 50/50 |
| — To lending pool | 281.25 USDC |
| — To treasury | 281.25 USDC |

The liquidator receives Card A (delivered via cross-chain unlock to their wallet on the source chain).

#### Cure scenario (Card B)

Before Card B's auction deadline, the borrower repays 1,500 USDC, bringing their remaining debt to 1,750 USDC after Card A's settlement. With only Card B as remaining collateral (weighted value $1,200), but debt now reduced sufficiently relative to remaining weighted collateral (depends on updated HF calculation), the auction may be cancelled if HF >= 1.0 — with all Card B bidders receiving full USDC refunds.

### D. Glossary

| Term | Definition |
|---|---|
| **Hub chain** | Solana mainnet-beta — where `slab_hub` runs lending, registry, oracle, and accounting |
| **Source chain** | Any EVM chain in `protocolConfig.evmSources` (e.g., Polygon for Courtyard, Base for Beezie) where collectible NFTs are minted and escrowed |
| **Collateral adapter** | Source-chain contract that escrows NFTs and sends LayerZero messages to the Solana hub |
| **NFT vault** | Source-chain contract that holds escrowed ERC-721 tokens; only the adapter can deposit or release |
| **Collateral ID** | Deterministic identifier: `keccak256(abi.encodePacked(sourceEID, collectionAddress, tokenId))` |
| **Health factor (HF)** | Ratio of weighted collateral value to outstanding debt; HF < 1.0 = undercollateralized |
| **LTV** | Loan-to-value ratio; the maximum fraction of collateral value that can be borrowed |
| **Effective LTV** | LTV after applying tier base, volatility haircut, and liquidity weight adjustments |
| **Tier** | Liquidity classification (1 = high, 2 = medium, 3 = illiquid) determining the base LTV |
| **Utilization** | `totalBorrowed / totalAssets` — drives dynamic borrow and supply APR |
| **Vault share** | Pro-rata claim on lending pool USDC (assets + accrued borrow interest); minted on deposit, burned on withdrawal |
| **Oracle price** | Attested USD price for a specific `(collection, tokenId)` pair, stored with 8 decimal places |
| **Price epoch** | The daily window during which an oracle price is considered fresh (0–24 hours, with 2-hour grace) |
| **Liquidation auction** | Per-card USDC auction when HF < 1.0; anti-sniping extends the deadline; settlement distributes proceeds to pool, treasury, and excess recipients |
| **Cure window** | Period during an active auction when a borrower can repay or add collateral to restore HF >= 1.0 and cancel all pending auctions |
| **Reserve price** | Minimum first bid in a liquidation auction, equal to the card's debt share plus the liquidation fee |
| **Cross-collateralized** | Default loan mode where all of a borrower's locked NFTs back a single shared debt position |
| **Isolated loan** | Optional loan mode where a single collateral item (or subset) backs an independent debt position with its own health factor |
| **Protocol fee** | Fraction of borrow interest (default 10%) retained by the protocol for reserves and treasury |
| **LayerZero V2** | Cross-chain messaging protocol used for lock notifications (EVM → Solana) and unlock commands (Solana → EVM) |
| **OApp** | LayerZero application — the `CollateralAdapterLayerZero` extends this to send and receive cross-chain messages |
| **DVN** | Decentralized Verifier Network — LayerZero's security layer that attests to cross-chain message validity |
| **EID** | Endpoint ID — LayerZero's chain identifier (Solana: 30168, Polygon: 30109, Base: 30184) |
| **BPS** | Basis points; 1 BPS = 0.01%; 10000 BPS = 100% |
| **WAD** | 10^18 — scaling constant used in fixed-point arithmetic for debt and share calculations |

---

*Slab Finance — Unlock liquidity for tokenized collectibles, without selling your NFTs.*
