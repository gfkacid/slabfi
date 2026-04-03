# Lending page — product & UI spec

This document specifies the **Lending** experience: a single place where users interact with the hub-chain **`LendingPool`** for **(1) depositing USDC into the vault**, **(2) borrowing USDC against cross-chain NFT collateral**, and **(3) repaying active loans**. It complements [PRD.md](../PRD.md) §4.1 (LendingPool), §6 (collateral registration), [specs/vault-deposits.md](./vault-deposits.md) (depositor mechanics and APR), and [DOCS.md](../DOCS.md).

---

## 1. Goals

- **One mental model:** “Lending” = supply liquidity, take a loan, or pay back — all on the **hub chain** (Arc Testnet or Arbitrum Sepolia per `VITE_HUB_NETWORK`).
- **Clear prerequisites:** Borrowing is only possible when the user has **eligible collateral** registered on the hub from **locked NFTs on the source chain** (Ethereum Sepolia) and the oracle has priced those positions.
- **Safe UX:** Show **available credit**, **outstanding debt**, **principal vs interest**, and **health factor** when relevant; never let the user submit a borrow above `availableCredit` or a repay above total debt.

---

## 2. Chain & wallet context

| Concern | Chain |
|--------|--------|
| Deposit, borrow, repay | **Hub** only (same wallet session as the borrower’s hub address) |
| Lock NFTs as collateral | **Source** (Sepolia) — see [PRD.md](../PRD.md) lock flow and `/lock` |

The Lending page does **not** submit NFT transfers; it only reads hub state (`CollateralRegistry`, `LendingPool`, `OracleConsumer`, `HealthFactorEngine` as needed). If the user has not yet locked cards on Sepolia, the UI should explain that and link to **Lock collateral**.

---

## 3. Route & layout (implementation)

**Recommended canonical path:** `/lending`.

The SPA may implement this as:

- **Single page** with three sections or tabs: **Deposit** | **Borrow** | **Repay**, or  
- **One page** with stacked sections and anchor links, or  
- **Temporary split routes** (`/borrow`, `/repay`, and optionally `/vault`) that share the same layout shell — until a unified `/lending` route ships.

Navigation labels should use **“Lending”** where a single entry point is desired (e.g. mobile bottom nav “Lend” → `/lending`).

---

## 4. Action 1 — Deposit USDC in the vault

**Actor:** Liquidity provider (any user; may be the same person as a borrower).

**Purpose:** Add **USDC** to the pool’s **supply side** so borrowers can draw from aggregate liquidity. Detailed math (shares, `totalAssets`, idle liquidity, **supply APR**) is defined in [specs/vault-deposits.md](./vault-deposits.md).

**UI requirements**

1. Connect wallet on the **hub chain**; show **USDC balance** (and native gas token if not USDC).
2. Input **amount** (respect USDC decimals used by deployment — 18 for mock USDC in this repo unless upgraded).
3. **Approve** `LendingPool` to spend USDC, then **`deposit(amount)`** (or the deployed equivalent) when the contract exposes a public deposit with share minting per PRD.
4. After success: show **vault shares** (or receipt), **user’s USDC-equivalent position**, and **current supply APR** / utilization if exposed by the contract.

**Contract alignment**

- Target ABI: public **`deposit` / `withdraw`** with share accounting ([PRD.md](../PRD.md) §4.1).  
- Until the repo is upgraded, some deployments may expose only **`depositLiquidity`** restricted to **`DEFAULT_ADMIN_ROLE`** — in that case the UI should either hide retail deposit or show an admin-only notice; see [DOCS.md](../DOCS.md) “Lending pool ABI surface”.

---

## 5. Action 2 — Borrow USDC from the vault

**Actor:** Borrower who will use **locked NFT collateral** on the source chain.

**Prerequisites (all must be satisfied for `availableCredit > 0`)**

1. User has called **`lockAndNotify`** on Sepolia so the hub has a **`CollateralRegistry`** entry for their **`hubOwner`** address.
2. Oracle has a **non-stale** price for `(collection, tokenId)` and collateral status is at least **ACTIVE** (or the registry’s `availableCredit` logic returns a positive cap).
3. **Health factor** and **position status** allow new borrows (e.g. not in **WARNING** / **LIQUIDATABLE** per protocol rules).

**UI requirements**

1. Hub chain only; **switch network** prompt if wrong chain.
2. Display **available to borrow** = `CollateralRegistry.availableCredit(borrower)` (or equivalent).
3. Amount input **capped** at available credit; optional **slider** and **live HF preview** via `previewHealthFactor` when collateral tiers and debt are known.
4. Primary action: **`LendingPool.borrow(amount)`** — no separate approval (USDC is sent *to* the user).
5. Empty state: **“No borrowing power”** with copy that explains locking NFTs on Sepolia and waiting for oracle / ACTIVE status.

**Errors**

- `Exceeds available credit` — disable submit and surface the cap.

---

## 6. Action 3 — Repay active loans

**Actor:** Borrower with **principal + accrued interest** outstanding on the hub.

**UI requirements**

1. Hub chain only.
2. Show **outstanding debt** breakdown: **principal**, **accrued interest**, **total** (`LendingPool.outstandingDebt(borrower)`).
3. **Approve** USDC for the pool, then **`LendingPool.repay(amount)`**; support **partial** and **full** repay (use **Max** = total debt).
4. After partial repay: optionally warn if position remains in **WARNING** zone (HF between thresholds).
5. When **total debt** reaches **zero**, enable **unlock collateral** (calls **`CollateralRegistry.initiateUnlock`** on the hub — separate from repay but may be surfaced on the same page or linked from **Repay**).

**Errors**

- `Exceeds debt` — cap input to total debt.

---

## 7. Shared UI elements

- **Health factor** badge (when borrower has collateral or debt).
- **Liquidation / auction** banner if the borrower has active liquidation auctions (see [liquidation-auctions.md](./liquidation-auctions.md)).
- Links: **Dashboard** (overview), **Lock** (source chain), **Liquidations** (public queue).

---

## 8. Analytics & events (optional)

For indexing: subscribe to `LiquidityDeposited`, `Borrowed`, `Repaid` on `LendingPool` and refresh balances after each transaction.

---

## 9. References

| Document | Relevance |
|----------|-----------|
| [PRD.md](../PRD.md) §4.1, §4.3, §4.6 | LendingPool behavior, interface catalogue |
| [specs/vault-deposits.md](./vault-deposits.md) | Deposit/withdraw, APR, utilization |
| [DOCS.md](../DOCS.md) | Env vars, deploy, key mechanics |
