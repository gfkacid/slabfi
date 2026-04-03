# Liquidation auctions — protocol spec

This document specifies **per-card USDC auctions** when a borrower’s health factor (HF) drops below 1.0. It replaces the legacy single-liquidator model (fixed delay, full debt + fee paid by one address). It complements [PRD.md](../PRD.md) §7, [specs/lending-page.md](./lending-page.md), [specs/nft-collateral-deposit.md](./nft-collateral-deposit.md), and [DOCS.md](../DOCS.md).

---

## 1. Overview

1. **Oracle updates** (e.g. every few hours) refresh card prices; the system recomputes HF for borrowers with open loans.
2. When **HF &lt; 1.0**, each **ACTIVE** collateral NFT for that borrower is **queued** for liquidation as a separate auction (`AuctionLiquidationManager` on the hub).
3. **Cure window**: While auctions are open, the borrower may **repay** or **add collateral** so that HF returns **≥ 1.0**. Then all pending auctions for that borrower are **cancelled** and **all bids are refunded**.
4. **Bidding**: Any user may bid in USDC. Bids are **non-withdrawable** until settlement or cancellation. **Outbid** users keep USDC in the contract and only pay the **difference** when placing a higher bid on the same auction.
5. **Anti-sniping**: If a bid is placed when the time remaining is **≤ anti-sniping window** (default 5 minutes), the auction **deadline** is extended to `block.timestamp + anti-sniping window`.
6. **No bids + initial duration elapsed**: If **zero bids** exist after the configured **auction duration** from start, the auction **remains open** (first bid is still accepted). After at least one bid, the auction ends **anti-sniping window** after the **last** bid unless extended again.
7. **Settlement** (`claim`): After the deadline, if **highest bid &gt; 0**, anyone may settle: NFT goes to the **winner**, USDC is distributed per §6, **losing bidders** are refunded.

---

## 2. Identifiers

- **`collateralId`**: `keccak256(abi.encodePacked(sourceChainId, collection, tokenId))` (same as hub registry).
- **`auctionId`**: `keccak256(abi.encodePacked(borrower, collateralId))` (one live auction per borrower + card).

---

## 3. Debt share and reserve price (starting bid)

At **queue** time, read **live** `totalDebt` and weighted collateral (same effective LTV / staleness rules as [HealthFactorEngine](../contracts/src/hub/HealthFactorEngine.sol) / `availableCredit` path):

```
cardWeightedValue_i = priceUSD_i * effectiveLTV_i   // 8-dec oracle units; then × 1e10 for USDC scale alignment in implementation
totalWeighted = Σ cardWeightedValue_j over borrower’s ACTIVE items with valid price

cardDebtShare = totalDebt * cardWeightedValue / totalWeighted   // proportional to borrowing power contributed
```

If `totalWeighted == 0`, queuing reverts or skips (implementation-defined guard).

**Liquidation fee** (configurable BPS, default 5% of **debt share**, not of the bid):

```
feeOnDebt = cardDebtShare * liquidationFeeBPS / 10000
reservePrice = cardDebtShare + feeOnDebt   // minimum first bid
```

`snapshot` stored on-chain:

- `debtShareSnapshot` = `cardDebtShare` (used to clear debt and to compute `feeOnDebt` at settlement).

---

## 4. Bid rules

| Rule | Definition |
|------|------------|
| First bid | `amount >= reservePrice` |
| Follow-up bids | `amount >= highestBid * (10000 + minBidIncrementBPS) / 10000` (default 1% step) |
| USDC pull | `transferFrom(bidder, auctionManager, amount - bidderDeposited)` for that auction |
| Withdrawals | Not allowed until **claim** (winner/losers) or **cancel** (all refunded) |

**Re-bid after being outbid**: Same bidder raises from `prevAmount` to `newAmount` → deposit only `newAmount - prevDeposited` (where `prevDeposited` equals their locked USDC for that auction).

---

## 5. Timing and anti-sniping

- **`startedAt`**: `block.timestamp` when queued.
- **`deadline`**: Initially `startedAt + auctionDuration` (configurable, default 24h).
- On **every** successful `placeBid`:
  - If `highestBid == 0` before the bid and `block.timestamp > deadline` (no bids until after original end): set `deadline = block.timestamp + antiSnipingWindow` so the first late bid opens a fair closing window.
  - If `deadline - block.timestamp <= antiSnipingWindow`, set `deadline = block.timestamp + antiSnipingWindow`.
- **`claim`**: `block.timestamp >= deadline` **and** `highestBid > 0`.
- **No bids**: `claim` cannot succeed; auction stays open for a first bid indefinitely until cancelled (cure) or superseded by protocol rules.

---

## 6. Settlement distribution (`claim`)

Let `W = highestBid`, `D = debtShareSnapshot`, `F = D * liquidationFeeBPS / 10000`, `E = W - D - F` (saturate at 0 if undercollateralized vs snapshot).

| Tier | Recipient | Amount |
|------|-----------|--------|
| Debt | `LendingPool` | `D` (USDC transfer + `partialClearDebt(borrower, D)`) |
| Fee | **Treasury** | `F` |
| Excess | **Vault + Treasury** | `E * surplusShareBPS / 10000` → pool, remainder → treasury (default 50/50) |

**Important**: The **fee** is always sent **directly to treasury**. Only **`E`** is split between vault and treasury per `surplusShareBPS`.

**Losing bidders**: Full **deposited** USDC refunded. **Winner**: No refund; their bid funds the distribution.

---

## 7. Cancellation (borrower cure)

When HF returns to **≥ 1.0** (HEALTHY or WARNING in current thresholds), `HealthFactorEngine` calls `cancelAllAuctionsForBorrower(borrower)`:

- For each non-terminal auction: refund all bidders, clear bid state, mark **cancelled**, remove from active index lists.
- Collateral remains **ACTIVE** on the borrower until normal unlock/repay flows apply.

---

## 8. Hub contracts (summary)

| Contract | Role |
|----------|------|
| `AuctionLiquidationManager` | Queue, bid, claim, cancel; holds bid USDC; config admin setters |
| `LendingPool` | `partialClearDebt` for per-card debt reduction; receives debt + vault share of excess |
| `CollateralRegistry` | `seizeLiquidatedCollateral` on successful claim (CCIP unlock to winner) |
| `HealthFactorEngine` | Queue **all** ACTIVE collaterals when liquidatable; cancel all when cured |

---

## 9. Admin parameters (not immutable)

All tunable via `DEFAULT_ADMIN_ROLE`:

- `auctionDuration`
- `minBidIncrementBPS`
- `liquidationFeeBPS`
- `antiSnipingWindow`
- `surplusShareBPS` (vault portion of **excess**; treasury gets the rest)
- `treasury`

---

## 10. Frontend (`/liquidations`)

- List **active auctions**: collateral preview, borrower (optional privacy), **reserve price**, **current highest bid**, **deadline** countdown.
- **Place bid**: approve USDC → `placeBid(auctionId, amount)`.
- **Settle**: `claim(auctionId)` when ended and `highestBid > 0`.
- Show **anti-sniping** notice when within the extension window.
- Index `AuctionQueued`, `BidPlaced`, `AuctionSettled`, `AuctionCancelled` (names per implementation) for history.

---

## 11. Edge cases

| Case | Behaviour |
|------|-----------|
| Cure vs `claim` same block | Ordering determines outcome; one tx may revert (e.g. claim after cancel). |
| `W < D + F` | `E = 0`; still clear debt up to `D` with `W` if implementation allows, or revert — **implementation must** ensure solvency: typically require `W >= reservePrice` so `W >= D + F` by construction. |
| Multiple ACTIVE cards | Independent auctions; partial clears reduce shared debt; HF should be recomputed off-chain / on next keeper pass. |
| Re-liquidation after cancel | Same `auctionId` allowed after cancel clears bid state. |

---

## 12. References

| Document | Relevance |
|----------|-----------|
| [PRD.md](../PRD.md) §5.3–5.4 | HF, staleness, LTV |
| [PRD.md](../PRD.md) §6 | CCIP unlock to recipient |
| [specs/lending-page.md](./lending-page.md) | Repay / HF UX |
| [DOCS.md](../DOCS.md) | Deploy env, contract addresses |
