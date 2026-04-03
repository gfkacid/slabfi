# Vault deposits (USDC liquidity) — product & UI spec

This document describes how **hub-chain USDC vault deposits** work for Slab.Finance, what depositors should see in the product, and how **dynamic APR** relates to utilization. It complements [PRD.md](../PRD.md) §4.1 (LendingPool), §5.1 (rates are separate from card pricing), and [DOCS.md](../DOCS.md).

---

## 1. Overview

**Liquidity providers** deposit **USDC** into the **LendingPool** on the hub chain (e.g. Arc). Deposited funds supply **borrowable liquidity** for users who have posted **NFT collateral** on source chains. Borrowers pay **interest** on loans; that interest (minus a **protocol fee**) accrues to the pool and increases the **value per vault share**. Depositors exit by **burning shares** and receiving USDC, subject to **idle liquidity** constraints.

---

## 2. Deposit mechanics

1. User connects the **hub** wallet and ensures sufficient **USDC** balance.
2. User **approves** the `LendingPool` to spend USDC (ERC-20 `approve`).
3. User calls **`deposit(uint256 amount)`** (USDC smallest units, e.g. 6 decimals on native USDC — align with deployment).
4. The pool **accrues** interest state (global + borrowers) before minting shares.
5. **Shares minted** (illustrative, implementation may use virtual offsets to mitigate inflation attacks):

   - If `totalShares == 0`: define initial rate (e.g. `shares = amount` or `shares = amount * 1e18 / initialPrice`).
   - Else: `sharesMinted = amount * totalShares / totalAssets` (integer division; round **down** in favor of the pool).

6. **`Deposited(depositor, assets, sharesMinted)`** is emitted for indexing.

**What “deposited balance” means in the UI:** not raw USDC the user originally sent, but the **current USDC value of their shares**:

`userAssets = balanceOfShares[user] * totalAssets / totalShares` (same rounding policy as the contract’s `previewRedeem` / `convertToAssets`).

---

## 3. Withdraw mechanics

1. User chooses an amount of **shares** to burn (or an equivalent **USDC** out target; the UI converts using the live exchange rate).
2. Pool **accrues**, then computes `assetsOut = shares * totalAssets / totalShares` (round **down**).
3. **Liquidity check:** `assetsOut` must be **≤ USDC.balanceOf(pool)** (idle cash). If almost all USDC is lent out, withdraw **reverts** — the UI must surface this clearly.
4. Pool burns shares, transfers USDC to the user.
5. **`Withdrawn(depositor, assets, sharesBurned)`** is emitted.

**Partial withdrawal:** If the user requests more than idle liquidity allows, options are:

- **Revert** (simplest): user lowers amount until it fits.
- **Partial fill** (optional product): contract or router sends max available; more complex to spec and audit.

Default recommendation: **revert** with a clear error; the UI suggests a **max withdrawable** = `min(userAssets, idleUSDC)` converted to shares.

---

## 4. Dynamic APR (utilization kink model)

### 4.1 Utilization

\[
U = \frac{\text{totalBorrowed}}{\text{totalAssets}}
\]

Use the same `totalAssets` definition as on-chain (typically **idle USDC + loans outstanding**, after accrual). If `totalAssets == 0`, define `U = 0`.

### 4.2 Borrow APR (annual, BPS)

Parameters (governance / deploy):

| Parameter | Example | Meaning |
|-----------|---------|---------|
| `baseRateBPS` | 200 | Floor borrow APR at zero utilization |
| `optimalUtilizationBPS` | 8000 | Kink at 80% utilization |
| `slope1BPS` | 1000 | Borrow APR slope **below** kink (annual BPS per 100% util) |
| `slope2BPS` | 15000 | Steep slope **above** kink |
| `protocolFeeBPS` | 1000 | Fraction of borrow interest retained by protocol |

Let `u = U` in 1e18 fixed-point if the contract uses that, or normalize `U` to 0–1 consistently with `optimalUtilizationBPS`.

**Below or at kink:**

\[
\text{borrowAPR\_BPS} = \text{baseRateBPS} + \frac{U \cdot \text{slope1BPS}}{U_{\text{scale}}}
\]

**Above kink:**

\[
\text{borrowAPR\_BPS} = \text{baseRateBPS} + \text{slope1BPS\_at\_kink} + \frac{(U - U_{\text{opt}}) \cdot \text{slope2BPS}}{U_{\text{scale}}}
\]

(Exact piecewise form matches [PRD.md](../PRD.md) §4.1; implementation uses per-second rates derived from annual BPS.)

### 4.3 Supply APR (what depositors care about)

\[
\text{supplyAPR\_BPS} = \text{borrowAPR\_BPS} \times U \times \frac{10000 - \text{protocolFeeBPS}}{10000}
\]

When utilization is **low**, borrow APR may be low but **supply APR** is further scaled by `U`, so depositor yield is small until the pool is actively lent out.

### 4.4 UI display

- Show **current supply APR** (and optionally **borrow APR** + **utilization %**) from views: `currentSupplyAPR()`, `currentBorrowAPR()`, `utilization()`.
- Label APR as **variable** and refresh on interval or block.
- Tooltip: “APR depends on how much of the pool is borrowed. Past performance does not guarantee future rates.”

---

## 5. Interest earned (depositors)

**Definition (UI):**

\[
\text{earnings} = \text{current USDC value of shares} - \text{cost basis}
\]

**Cost basis** is tracked **client-side** (or via subgraph): sum of USDC deposited minus USDC withdrawn (not protocol-enforced). Alternatively show **all-time yield** from events:

- Sum `assets` from `Deposited` minus sum `assets` from `Withdrawn` for the user vs. current `convertToAssets(shares)` — net paper PnL.

Show **lifetime earned** and optionally **30d / 7d** estimates using historical share price if indexed.

---

## 6. UI requirements

### 6.1 Deposit view (`/lending` page, "supply" section)

| Element | Behavior |
|---------|----------|
| USDC wallet balance | Read from ERC-20 `balanceOf` on hub |
| Amount input | Validate > 0, ≤ balance, respect min dust if any |
| Projected shares | `previewDeposit(amount)` or client mirror |
| Current **supply APR** | `currentSupplyAPR()` |
| **Utilization** | `utilization()` |
| Approve + Deposit | Two-step when allowance insufficient; single Deposit when sufficient |
| Success | Toast + refresh shares, earnings, APR |

### 6.2 Position view (has shares > 0)

| Element | Behavior |
|---------|----------|
| **Deposited value** | `convertToAssets(shares)` or equivalent |
| **Share balance** | `balanceOfShares` |
| **Current supply APR** | `currentSupplyAPR()` |
| **Earnings** | See §5 |
| Link to withdraw | Same page section or second step |

### 6.3 Withdraw view

| Element | Behavior |
|---------|----------|
| Shares or USDC-out input | Convert both directions with previews |
| **Max withdrawable** | `min(userAssets, idleUSDC)` |
| **Idle liquidity** indicator | Show pool idle vs. total assets |
| Warning | When utilization high: “Full withdrawal may be unavailable until borrowers repay or new deposits arrive.” |
| Withdraw CTA | `withdraw(shares)` |
| Revert handling | Map `InsufficientLiquidity` (or generic) to user copy |

### 6.4 Dashboard integration

Compact **Vault / Earn** card:

- USDC value of position
- Supply APR (small)
- Earnings (lifetime or since first deposit)
- Buttons: **Add funds** → `/vault`, **Withdraw**

Sits alongside **borrow** position (debt, HF, collateral), not merged into the same row unless space allows.

---

## 7. Events (indexing)

| Event | Indexed fields | Use |
|-------|----------------|-----|
| `Deposited` | `depositor` | Rebuild LP positions, TVL history |
| `Withdrawn` | `depositor` | Same |
| `Borrowed` / `Repaid` | `borrower` | Utilization and APR movement |

---

## 8. Edge cases

| Case | Behavior |
|------|----------|
| First depositor | Define initial share minting rule; document in deploy notes |
| **Utilization → 100%** | Idle USDC ≈ 0; withdraws revert until repay or new `deposit` |
| Rounding | Favor the pool on mint/burn; document 1 wei dust |
| Interest accrual timing | APR is instantaneous from state; actual yield depends on time and utilization path |
| Liquidation inflow | Debt + fee paid in USDC **increases** idle liquidity and pool assets — can improve withdrawability |
| Oracle / bad debt | Out of scope for this doc; treasury / insurance may absorb shortfalls in future versions |

---

## 9. Related specs

- [PRD.md](../PRD.md) — `LendingPool` storage, rate formulas, liquidation **debt + fee**
- [PRD.md](../PRD.md) §5.1 — **EXTERNAL_PRICE_API** (collateral pricing, not vault APR)
- [DOCS.md](../DOCS.md) — deploy order, env vars, repo vs. PRD ABI gap
