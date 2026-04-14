# Slab.Finance — UI wireframes (ASCII)

Low-fidelity **structural** wireframes for the Vite + React app. They mirror routed pages in `src/App.tsx` and global modals from `src/components/modal/`. Use them for UX reviews, onboarding, and keeping layout intent aligned with implementation.

## Legend

| Symbol | Meaning |
|--------|---------|
| `+--…--+` | Viewport / region boundary |
| `[ Label ]` | Primary or secondary **button** / chip |
| `( … )` | **Text input** or editable field |
| `{ … }` | **Optional** or conditional block |
| `| … |` | **Table** row or columnar list |
| `…` | Truncated / **scrollable** content |
| `~~…~~` | **Disabled** or blocked state (conceptual) |
| `>>` | **Loading** / in-flight action |
| `(i)` | Inline **info** / helper copy |

**States:** wireframes may label **Guest** (wallet disconnected) vs **Connected**.

## Wallet / auth

There is no email sign-in. **EVM:** Reown AppKit `AppKitButton` in `AppHeader`. **Solana:** Phantom / Solflare via `Web3Provider`. Some flows require **hub** chain vs **source** chain (Polygon/Base on `/lock`).

## Index (file → route or trigger)

| File | URL / trigger |
|------|----------------|
| [00-app-shell.md](./00-app-shell.md) | Global layout around all routes |
| [01-dashboard.md](./01-dashboard.md) | `/` |
| [02-assets.md](./02-assets.md) | `/assets` |
| [03-lending-hub.md](./03-lending-hub.md) | `/lending`, `/lending?tab=borrow`, `/lending?tab=repay` |
| [04-borrow-standalone.md](./04-borrow-standalone.md) | `/borrow` |
| [05-repay-standalone.md](./05-repay-standalone.md) | `/repay` |
| [06-lock.md](./06-lock.md) | `/lock` |
| [07-liquidations.md](./07-liquidations.md) | `/liquidations` |
| [08-modal-collateral-deposit.md](./08-modal-collateral-deposit.md) | Modal `openModal("collateralDeposit")` |
| [09-modal-bid.md](./09-modal-bid.md) | Modal `openModal("bid", …)` from liquidation rows |
| [10-protocol-stats.md](./10-protocol-stats.md) | Cross-cutting stats (no dedicated route) |

## Legacy (not wireframed separately)

`DashboardPage.tsx` exists in the repo but is **not** mounted in `App.tsx`; the live home is `StitchDashboardPage` → see [01-dashboard.md](./01-dashboard.md).

## Conventions

- Width targets ~72 columns for readable monospace in editors and GitHub.
- Prefer **structure** over pixel-perfect layout.
