# Slab.Finance Developer Documentation

Protocol reference for developers: repository layout, environment, deployment order, verification, mechanics (collateral lifecycle, health factor, lending UI, liquidations, LayerZero), and end-to-end flow.

For a focused deployment and local stack walkthrough, see **[SETUP.md](./SETUP.md)**.

## Repository layout

The repo is a **pnpm workspace** with these main areas:

| Path | Purpose |
|------|---------|
| [`programs/slab_hub/`](programs/slab_hub/) | **Anchor** — Solana hub program (lending, registry, oracle, vault, LZ entry) |
| [`contracts/`](contracts/) | Solidity / Foundry — EVM source chain (vault, LayerZero adapter), tests |
| [`frontend/`](frontend/) | **Vite + React** SPA — Solana wallet adapter + Reown/Wagmi for EVM |
| [`backend/`](backend/) | **NestJS** REST API — protocol stats, positions, auctions, collateral, activity (reads **MySQL** populated by the indexer) |
| [`indexer/`](indexer/) | **TypeScript** service — polls hub + source chains, writes events and snapshots to **MySQL** |
| [`prisma/`](prisma/) | Shared **Prisma** schema for backend + indexer |
| [`shared/`](shared/) | **`@slabfinance/shared`** — types, constants (ABIs, chain ids, status labels), and **[`shared/config/protocol.ts`](shared/config/protocol.ts)** (Solana hub + **multi-chain EVM sources**: Polygon, Base, LZ endpoint ids, contract addresses) |
| [`specs/`](specs/) | Product **specs** — e.g. [vault-deposits.md](specs/vault-deposits.md), [lending-page.md](specs/lending-page.md), [liquidation-auctions.md](specs/liquidation-auctions.md) |

Root files:

- [`pnpm-workspace.yaml`](pnpm-workspace.yaml) — workspace package list
- [`package.json`](package.json) — root scripts (`pnpm dev:frontend`, `pnpm dev:backend`, `pnpm dev:indexer`, `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm run build`, `pnpm run lint`)
- [`tsconfig.base.json`](tsconfig.base.json) — base TS options for packages
- [`.env.example`](.env.example) — secrets and local-only settings (`DATABASE_URL`, `DEPLOYER_PRIVATE_KEY`, `VITE_WALLETCONNECT_PROJECT_ID`, indexer tuning)

**Install and run:**

```bash
pnpm install
pnpm dev:frontend   # Vite dev server (default http://localhost:3000)
pnpm dev:backend  # Nest dev server (default http://localhost:3001)
pnpm dev:indexer  # Chain indexer → MySQL (set `DATABASE_URL`; addresses in shared/config/protocol.ts)
```

From clone through contract deploy, database seed, and running all services, follow **[SETUP.md](./SETUP.md)**.

The Vite app reads environment variables from **`frontend/.env`** (not the repo root). Copy or symlink from the root example:

```bash
cp .env.example frontend/.env
# or: ln -s ../.env frontend/.env
```

**Build (CI / production):**

```bash
pnpm run build   # builds shared, runs prisma generate, backend, indexer, frontend
```

Foundry remappings use OpenZeppelin and **LayerZero** packages under [`contracts/lib/`](contracts/lib/) (and root `node_modules` where referenced).

## MySQL (backend + indexer)

There is **no Docker Compose** in this repository. Use a local or hosted **MySQL 8+** instance.

1. Create a database (e.g. `slabfinance`).
2. Set `DATABASE_URL` in the repo root `.env` (see [`.env.example`](.env.example)), e.g. `mysql://user:pass@127.0.0.1:3306/slabfinance`.
3. From the repo root:

   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:push
   # or: pnpm db:migrate
   ```

4. Start the indexer so tables receive chain data, then the API will serve fresh reads.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast)
- [Node.js](https://nodejs.org/) 18+ and [pnpm](https://pnpm.io/)
- **MySQL 8+** (for backend + indexer; see above)
- Wallets with **mainnet** funds where you deploy and demo: **SOL** (Solana), **POL** (Polygon), **ETH** (Base)

## Environment Setup

1. Copy the example env file (Vite reads **`frontend/.env`** when developing the SPA):

   ```bash
   cp .env.example frontend/.env
   ```

2. Set **`VITE_WALLETCONNECT_PROJECT_ID`**, **`DATABASE_URL`**, and (for deploys) **`DEPLOYER_PRIVATE_KEY`**. Optional: **`VITE_EXTERNAL_PRICE_API_BASE`**, **`PORT`**, **`INDEXER_POLL_INTERVAL_MS`**, **`INDEXER_LOG_CHUNK_SIZE`**.

### Chain and contract configuration

**Hub:** Solana **mainnet-beta**. **EVM sources:** **Polygon**, **Base**, and any extra entries you add under **`protocolConfig.evmSources`**.

RPC defaults, LayerZero endpoint ids, program id, and **deployed contract addresses** live in **[`shared/config/protocol.ts`](shared/config/protocol.ts)**. After Foundry deploys, write **`contracts/deployments/evm/polygon.json`** / **`base.json`** and run **`pnpm sync:protocol`** to patch the `// @slabfi-sync:…` regions (see [DEPLOYMENTS.md](./DEPLOYMENTS.md)).

**`scripts/print-deploy-env.ts`** emits `export` lines for Solana and each configured source (used by [`scripts/deploy-all.sh`](scripts/deploy-all.sh)).

| Variable | Description |
|----------|-------------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID (Reown AppKit) |
| `VITE_EXTERNAL_PRICE_API_BASE` | Optional. Base URL for **EXTERNAL_PRICE_API** (see [PRD.md](PRD.md) §5.1 and [specs/vault-deposits.md](specs/vault-deposits.md)) when the lock UI fetches card valuations off-chain |
| `DATABASE_URL` | MySQL for Nest + indexer |
| `DEPLOYER_PRIVATE_KEY` | Used by Foundry scripts (`deploy-all.sh`); never commit real keys |
| `PORT` | Backend HTTP port (default in code: `3001`) |
| `INDEXER_POLL_INTERVAL_MS` / `INDEXER_LOG_CHUNK_SIZE` | Indexer polling tuning |

### Lending pool ABI surface (target vs. repo)

The protocol spec in [PRD.md](PRD.md) defines an open **USDC vault** with **`deposit` / `withdraw`**, **share** accounting, and **utilization-based** **`currentBorrowAPR` / `currentSupplyAPR`**. The deployed `LendingPool` in this repo may still expose older names (for example `depositLiquidity`, `totalReserves`, fixed `annualInterestRateBPS`) until contracts are upgraded to match the PRD. After alignment, extend [`shared/constants/abis.ts`](shared/constants/abis.ts) and hooks to include the new view and write methods.

The SPA uses **Solana** for hub lending and **Wagmi** on **Polygon** and **Base** for EVM-side locks (see [`frontend/src/lib/chains.ts`](frontend/src/lib/chains.ts), [`frontend/src/lib/contracts.ts`](frontend/src/lib/contracts.ts)). Chain metadata and addresses come from **`protocolConfig`** in **`@slabfinance/shared`**.

**Fees:** Solana transactions pay **SOL**; each EVM `_lzSend` pays that chain’s **native gas token** for LayerZero delivery. Use [LayerZero Scan](https://layerzeroscan.com/) for cross-chain status.

For shell exports, run `pnpm print:deploy-env` from the repo root.

## Deployment Order

Deploy the Solana program first, then wire LayerZero peers and deploy **`NFTVault` + `CollateralAdapterLayerZero`** on **each** EVM source chain you support (Polygon, Base, …).

### Step 1: Deploy Solana hub program

From the repo root (with Anchor toolchain installed):

```bash
cd programs/slab_hub
anchor build
anchor deploy --provider.cluster mainnet-beta   # or devnet for mocks
```

Record the deployed **program id** in [`shared/config/protocol.ts`](shared/config/protocol.ts) under `hub.programs.slabHub`. Run `pnpm print:deploy-env` to emit shell exports (`SLAB_HUB_PROGRAM_ID`, `SOLANA_RPC_URL`, LZ ids).

Initialize pool / registry / oracle per program instructions (see [`programs/README.md`](programs/README.md)).

### Step 2: Deploy EVM sources (per chain)

Use **`contracts/script/Deploy_EvmSourceLayerZero.s.sol`** on **Polygon**, **Base**, etc. Set **`LZ_ENDPOINT`**, **`LZ_DST_EID=30168`**, **`COLLECTION`**, **`SOURCE_CHAIN_ID`**, and write JSON to **`contracts/deployments/evm/<network>.json`**, then **`pnpm sync:protocol`**.

USDC for borrows is the **Solana** hub USDC mint in **`protocol.ts`** (`hub.usdcMint`).

### Step 3: Fund LayerZero / executors

Solana pays **rent + executor fees** in **SOL**; each EVM source pays its **native gas token** for `_lzSend`. Use [LayerZero Scan](https://layerzeroscan.com/) to debug stuck messages.

### Step 4: Set oracle prices

Collateral becomes **ACTIVE** once the on-chain oracle has a fresh price for that NFT key. In development, call the `slab_hub` oracle instruction (or use the backend **`SolanaOracleService`** stub wired to your authority keypair). Production uses the same program surface with a secured signer.

### Step 5: Configure the app

Add deployed values to **[`shared/config/protocol.ts`](shared/config/protocol.ts)** (`hub.programs`, `hub.whitelistedCollections`, `evmSources.*.contracts`, `integrations`). Set **`VITE_WALLETCONNECT_PROJECT_ID`** in `.env` / `frontend/.env`.

Restart `pnpm dev:frontend` after changing config or env files.

## Post-Deployment Verification

```bash
pnpm print:deploy-env
# Solana: use `solana account <PDA>` / Anchor IDL `account` fetches for pool + registry state.
# EVM: `cast call` against `NFTVault` / `CollateralAdapterLayerZero` on each chain as needed.
```

## Key Mechanics

### LayerZero messaging (EVM → Solana hub)

- **Lock notice** (EVM → Solana): Sent by `CollateralAdapterLayerZero` when an NFT is locked; the Solana program’s LZ entry decodes the payload and registers collateral.
- **Unlock** (Solana → EVM): Delivered to the adapter / vault path per OApp configuration so the NFT can be released on the correct **source chain id**.

### Collateral Lifecycle

1. **PENDING** — LockNotice received, awaiting first oracle price.
2. **ACTIVE** — Priced; contributes to borrower’s health factor and available credit.
3. **UNLOCK_SENT** — Unlock message dispatched via LayerZero.
4. **RELEASED** — NFT returned to recipient on source chain.

### Health Factor

```
HF = Weighted Collateral Value / (principal + interestAccrued)
Weighted = Σ (price_i × effectiveLTV_i)
```

- HF ≥ 1.30 → HEALTHY
- 1.00 ≤ HF < 1.30 → WARNING (no new borrows)
- HF < 1.00 → LIQUIDATABLE (6h queue, then liquidatable)

On-chain and UI enums for status values are aligned in **`@slabfinance/shared`** ([`shared/types/`](shared/types/), [`shared/constants/status.ts`](shared/constants/status.ts)).

### Lending page (UI)

The **Lending** experience is specified in **[specs/lending-page.md](specs/lending-page.md)**. On the hub chain, users should be able to:

1. **Deposit USDC** into the vault (liquidity provision; shares and APR — see [specs/vault-deposits.md](specs/vault-deposits.md)).
2. **Borrow USDC** against collateral that was registered by **locking NFTs on an EVM source** (`lockAndNotify` on Polygon/Base); borrow amount is capped by hub **`availableCredit`** (per program / API).
3. **Repay** active loans on Solana; when debt is zero, **initiate unlock** to release NFTs on the source chain (may live on the same page or **Repay** flow).

Implementation may use a single route (e.g. `/lending`) with tabs/sections, or separate routes (`/borrow`, `/repay`, vault deposit) until unified. See [PRD.md](PRD.md) §11.3.

### Vault deposits (liquidity providers)

- Users **`deposit`** USDC into the hub **`LendingPool`** and receive **vault shares** (pro-rata claim on pool assets).
- **`withdraw(shares)`** burns shares and returns USDC **only up to idle liquidity**; if utilization is high, full withdrawal may **revert** until borrowers repay or new deposits arrive.
- **Borrow APR** and **supply APR** are **dynamic**: they depend on **utilization** \(borrowed / total assets\) via a kinked curve (see [PRD.md](PRD.md) §4.1 and [specs/vault-deposits.md](specs/vault-deposits.md)).
- Depositors earn from **interest paid by borrowers** (net of protocol fee), reflected in a rising **share price** / **exchange rate**.

### Liquidations (summary)

When **HF &lt; 1.0**, the hub liquidation module opens a **USDC auction per ACTIVE collateral**. Settlement sends debt proceeds to the pool and routes the NFT to the winning bidder; cross-chain collateral uses **LayerZero** for release on the source chain where applicable. Details: [specs/liquidation-auctions.md](specs/liquidation-auctions.md) and [PRD.md](PRD.md) §7.

### Card pricing (lock UI)

Before locking an NFT, the app should call **EXTERNAL_PRICE_API** (documented in [PRD.md](PRD.md) §5.1) for **USD value**, **suggested LTV**, and freshness fields. On-chain prices come from the **`slab_hub` oracle** (backend-signed updates in production).

## Running the Full Flow

1. Start the app: `pnpm dev:frontend` and open the printed URL.
2. (Liquidity provider path) On **Solana**, deposit USDC into the pool per program instructions / UI when wired ([specs/vault-deposits.md](specs/vault-deposits.md)).
3. Connect **Polygon** or **Base** in the wallet UI for EVM collectibles (per integration).
4. Use **EXTERNAL_PRICE_API** (or mock) in the lock flow; approve the adapter and call **`lockAndNotify`**. Pay the chain’s **native token** for LayerZero fees.
5. Track delivery on [LayerZero Scan](https://layerzeroscan.com/).
6. Ensure the **hub oracle** has a price for that collateral (backend signer or dev mock).
7. On **Solana**, borrow USDC against registered collateral via the hub program / UI.
8. To unlock: repay on Solana, then complete the unlock path (including LayerZero back to the EVM source chain when collateral is cross-chain).
9. (LP path) **Withdraw** when the pool has enough idle USDC.
