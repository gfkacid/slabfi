# Slab.Finance Developer Documentation

Step-by-step instructions for setting up and deploying the Slab.Finance protocol.

## Repository layout

The repo is a **pnpm workspace** with these main areas:

| Path | Purpose |
|------|---------|
| [`contracts/`](contracts/) | Solidity / Foundry — hub and source deployments, tests |
| [`frontend/`](frontend/) | **Vite + React** SPA — wallet UI (Reown AppKit, Wagmi, Viem) |
| [`backend/`](backend/) | **NestJS** REST API — protocol stats, positions, auctions, collateral, activity (reads **MySQL** populated by the indexer) |
| [`indexer/`](indexer/) | **TypeScript** service — polls hub + source chains, writes events and snapshots to **MySQL** |
| [`prisma/`](prisma/) | Shared **Prisma** schema for backend + indexer |
| [`shared/`](shared/) | **`@slabfinance/shared`** — shared TypeScript **types** and **constants** (ABIs, chain id, status labels, enums) consumed by the frontend build and the backend |
| [`specs/`](specs/) | Product **specs** — e.g. [vault-deposits.md](specs/vault-deposits.md), [lending-page.md](specs/lending-page.md), [liquidation-auctions.md](specs/liquidation-auctions.md) |

Root files:

- [`pnpm-workspace.yaml`](pnpm-workspace.yaml) — workspace package list
- [`package.json`](package.json) — root scripts (`pnpm dev:frontend`, `pnpm dev:backend`, `pnpm dev:indexer`, `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm run build`, `pnpm run lint`)
- [`tsconfig.base.json`](tsconfig.base.json) — base TS options for packages
- [`.env.example`](.env.example) — template for **frontend** (`VITE_*`) and **deploy/script** variables

**Install and run:**

```bash
pnpm install
pnpm dev:frontend   # Vite dev server (default http://localhost:3000)
pnpm dev:backend  # Nest dev server (default http://localhost:3001)
pnpm dev:indexer  # Chain indexer → MySQL (set `DATABASE_URL` and indexer env vars)
```

The Vite app reads environment variables from **`frontend/.env`** (not the repo root). Copy or symlink from the root example:

```bash
cp .env.example frontend/.env
# or: ln -s ../.env frontend/.env
```

**Build (CI / production):**

```bash
pnpm run build   # builds shared, runs prisma generate, backend, indexer, frontend
```

Foundry remappings expect Chainlink packages under the **repo root** `node_modules` (installed via root `devDependencies` in [`package.json`](package.json)).

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
- A wallet with testnet funds:
  - **Arc Testnet** — [Circle faucet](https://faucet.circle.com) (USDC is native gas token)
  - **Ethereum Sepolia** — [Sepolia faucet](https://sepoliafaucet.com) (ETH for gas)

## Environment Setup

1. Copy the example env file (for local dev, put values in **`frontend/.env`** so Vite can read them):

   ```bash
   cp .env.example frontend/.env
   ```

2. Set variables as needed. Split by concern:

### Deploy / scripts (root `.env` or shell)

These are used by Foundry scripts and `cast`, not by the Vite bundle.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | **MySQL** connection string for the Nest API and indexer (e.g. `mysql://user:pass@127.0.0.1:3306/slabfinance`) |
| `DEPLOYER_PRIVATE_KEY` | Private key of the deployer wallet (hex, no 0x) |
| `ARC_TESTNET_RPC` | `https://rpc.testnet.arc.network` |
| `SEPOLIA_RPC` | `https://rpc.sepolia.org` |
| `CCIP_ROUTER_ARC` | `0xdE4E7FED43FAC37EB21aA0643d9852f75332eab8` |
| `CCIP_ROUTER_SEPOLIA` | `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59` |
| `ARC_CHAIN_SELECTOR` | `3034092155422581607` |
| `SEPOLIA_CHAIN_SELECTOR` | `16015286601757825753` |
| `CCIP_ROUTER_HUB` | Optional. If set, `Deploy_Hub.s.sol` uses this instead of `CCIP_ROUTER_ARC` (use for non-Arc hubs) |
| `HUB_CHAIN_SELECTOR` | Optional. Overrides `ARC_CHAIN_SELECTOR` when deploying the Sepolia adapter so it targets the correct hub |

### Frontend (`frontend/.env` — `VITE_*` only)

Vite exposes only variables prefixed with `VITE_`. The React app resolves the hub from **`VITE_HUB_NETWORK`**.

| Variable | Description |
|----------|-------------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID (Reown AppKit) |
| `VITE_HUB_NETWORK` | `arc` (default) or `arbitrumSepolia` — which chain the app treats as the lending hub |
| `VITE_ARC_TESTNET_RPC_URL` | Optional override for Arc RPC (default in code: `https://rpc.testnet.arc.network`) |
| `VITE_SEPOLIA_RPC_URL` | Optional; Sepolia chain config comes from Viem — use for custom RPC if you extend config |
| `VITE_LENDING_POOL_ADDRESS` | Hub lending pool |
| `VITE_COLLATERAL_REGISTRY_ADDRESS` | Hub collateral registry |
| `VITE_ORACLE_CONSUMER_ADDRESS` | Hub oracle consumer |
| `VITE_HEALTH_FACTOR_ENGINE_ADDRESS` | Hub health factor engine |
| `VITE_LIQUIDATION_MANAGER_ADDRESS` | Hub **AuctionLiquidationManager** (env name unchanged) |
| `VITE_USDC_ADDRESS` | Hub USDC |
| `VITE_COLLATERAL_ADAPTER_ADDRESS` | Sepolia collateral adapter |
| `VITE_SLAB_FINANCE_COLLECTIBLE_ADDRESS` | Sepolia demo collectible NFT contract address |
| `VITE_EXTERNAL_PRICE_API_BASE` | Optional. Base URL for **EXTERNAL_PRICE_API** (see [PRD.md](PRD.md) §5.1 and [specs/vault-deposits.md](specs/vault-deposits.md)) when the lock UI fetches card valuations off-chain |

Optional reference entries in [`.env.example`](.env.example) (`VITE_CCIP_*`, selectors) mirror deploy docs; the current SPA does not read them unless you wire them in code.

### Lending pool ABI surface (target vs. repo)

The protocol spec in [PRD.md](PRD.md) defines an open **USDC vault** with **`deposit` / `withdraw`**, **share** accounting, and **utilization-based** **`currentBorrowAPR` / `currentSupplyAPR`**. The deployed `LendingPool` in this repo may still expose older names (for example `depositLiquidity`, `totalReserves`, fixed `annualInterestRateBPS`) until contracts are upgraded to match the PRD. After alignment, extend [`shared/constants/abis.ts`](shared/constants/abis.ts) and hooks to include the new view and write methods.

## Hub chain selection

The frontend resolves the hub from **`VITE_HUB_NETWORK`** (see [`frontend/src/lib/hub.ts`](frontend/src/lib/hub.ts)):

- **`arc`** (default) — Arc Testnet (chain id `5042002`), native gas is USDC.
- **`arbitrumSepolia`** — Arbitrum Sepolia (chain id `421614`), native gas is ETH.

Contract addresses use the same **`VITE_*`** hub and Sepolia keys for either hub; after deploying, paste addresses into **`frontend/.env`** and set **`VITE_HUB_NETWORK`** to match.

Shared enums and hub typing live in **`@slabfinance/shared`** ([`shared/types/hub.ts`](shared/types/hub.ts)).

**Arbitrum Sepolia CCIP (reference):** router `0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`, chain selector `3478487238524512106`. RPC: `https://sepolia-rollup.arbitrum.io/rpc`. There is a CCIP lane between Ethereum Sepolia and Arbitrum Sepolia.

**Deploy hub on Arbitrum Sepolia:**

1. Set `CCIP_ROUTER_HUB` to the Arbitrum Sepolia CCIP router (do not set `CCIP_ROUTER_ARC`).
2. Run `forge script script/Deploy_Hub.s.sol --rpc-url https://sepolia-rollup.arbitrum.io/rpc --broadcast`.
3. Deploy Sepolia source with `HUB_CCIP_ROUTER_ADDRESS` and `HUB_CHAIN_SELECTOR=3478487238524512106` (or rely on `HUB_CHAIN_SELECTOR` only).

**Fund CCIP outbound fees:** On Arc, send native USDC to `CCIPMessageRouter`. On Arbitrum Sepolia, send native ETH (or use a supported CCIP fee token per [Chainlink CCIP docs](https://docs.chain.link/ccip)).

For `cast` examples below, substitute `--rpc-url` with your hub RPC (`$ARC_TESTNET_RPC` on Arc, or Arbitrum Sepolia RPC when the hub is Arbitrum).

## Deployment Order

Hub contracts must be deployed before source chain contracts (the adapter needs the hub router address).

### Step 1: Deploy Hub (Arc Testnet)

```bash
cd contracts
forge script script/Deploy_Hub.s.sol --rpc-url $ARC_TESTNET_RPC --broadcast
```

This deploys:

- MockFdcVerification, MockUSDC (1M minted)
- OracleConsumer, CollateralRegistry, LendingPool, AuctionLiquidationManager, HealthFactorEngine (UUPS proxies)
- CCIPMessageRouter, ChainlinkAutomationKeeper
- May seed initial USDC liquidity (implementation-specific). Anyone can add liquidity afterward via the pool’s public **`deposit`** once that function exists on chain.

**Save the `CCIPMessageRouter` address** — you need it for Step 2.

### Step 2: Deploy Source Chain (Ethereum Sepolia)

Set `HUB_CCIP_ROUTER_ADDRESS` to the CCIPMessageRouter address from Step 1.

```bash
export HUB_CCIP_ROUTER_ADDRESS=<CCIPMessageRouter_address_from_step_1>
forge script script/Deploy_Sepolia.s.sol --rpc-url $SEPOLIA_RPC --broadcast
```

This deploys:

- `CardFiCollectible` demo NFT (Solidity contract name; 3 sample tokens minted and metadata set)
- NFTVault, CollateralAdapter_CardFiCollectible

### Step 3: Register Adapter on Hub

Register the Sepolia adapter so the hub accepts LOCK_NOTICE messages from it:

```bash
cast send $CCIP_MESSAGE_ROUTER_ADDRESS \
  "registerAdapter(uint64,address)" \
  $SEPOLIA_CHAIN_SELECTOR \
  $COLLATERAL_ADAPTER_ADDRESS \
  --rpc-url $ARC_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### Step 4: Fund CCIP Router

The CCIPMessageRouter on Arc needs native USDC to pay for outbound CCIP messages (UnlockCommand):

```bash
# Arc uses USDC as native gas token — send USDC to the router
cast send $CCIP_MESSAGE_ROUTER_ADDRESS \
  --value 0.1ether \
  --rpc-url $ARC_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

(On Arc, `--value` sends native USDC.)

### Step 5: Set Oracle Prices

For collateral to become ACTIVE, the OracleConsumer needs prices. Use the mock setter:

```bash
cast send $ORACLE_CONSUMER_ADDRESS \
  "setMockPrice(address,uint256,uint256)" \
  $SLAB_FINANCE_COLLECTIBLE_ADDRESS \
  1 \
  15000000000 \
  --rpc-url $ARC_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

(Price is 8 decimals: 15000000000 = $150.00.) Repeat for token IDs 2 and 3 if needed.

### Step 6: Configure the frontend

Add the deployed addresses to **`frontend/.env`** (Vite prefix **`VITE_`**):

```
VITE_LENDING_POOL_ADDRESS=
VITE_COLLATERAL_REGISTRY_ADDRESS=
VITE_ORACLE_CONSUMER_ADDRESS=
VITE_HEALTH_FACTOR_ENGINE_ADDRESS=
VITE_LIQUIDATION_MANAGER_ADDRESS=   # AuctionLiquidationManager proxy
VITE_USDC_ADDRESS=
VITE_COLLATERAL_ADAPTER_ADDRESS=
VITE_SLAB_FINANCE_COLLECTIBLE_ADDRESS=
```

Also set **`VITE_WALLETCONNECT_PROJECT_ID`** and **`VITE_HUB_NETWORK`** as needed.

Restart `pnpm dev:frontend` after changing env files.

## Post-Deployment Verification

```bash
# Check pool size (use totalAssets() when implemented; else totalReserves() or USDC balance + borrows per PRD)
cast call $LENDING_POOL_ADDRESS "totalAssets()" --rpc-url $ARC_TESTNET_RPC

# Check router has registry set
cast call $CCIP_MESSAGE_ROUTER_ADDRESS "collateralRegistry()" --rpc-url $ARC_TESTNET_RPC

# Check adapter is registered
cast call $CCIP_MESSAGE_ROUTER_ADDRESS "trustedAdapters(uint64)" $SEPOLIA_CHAIN_SELECTOR --rpc-url $ARC_TESTNET_RPC
```

## Key Mechanics

### CCIP Messaging

- **LOCK_NOTICE** (Sepolia → Arc): Sent by CollateralAdapter when an NFT is locked. Payload: `(messageType, sourceChainSelector, collection, tokenId, hubOwner)`. CCIPMessageRouter validates the sender and calls `CollateralRegistry.registerCollateral()`.
- **UNLOCK_COMMAND** (Arc → Sepolia): Sent by CCIPMessageRouter when a borrower initiates unlock or a liquidation executes. Payload: `(messageType, collateralId, recipient)`. CollateralAdapter receives it and calls `NFTVault.release()`.

### Collateral Lifecycle

1. **PENDING** — LockNotice received, awaiting first oracle price.
2. **ACTIVE** — Priced; contributes to borrower’s health factor and available credit.
3. **UNLOCK_SENT** — UnlockCommand dispatched via CCIP.
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
2. **Borrow USDC** against collateral that was registered by **locking NFTs on the source chain** (`lockAndNotify` on Sepolia); borrow amount is capped by **`availableCredit`** on `CollateralRegistry`.
3. **Repay** active loans (approve USDC, then `repay`); when debt is zero, **initiate unlock** to release NFTs on Sepolia (may live on the same page or **Repay** flow).

Implementation may use a single route (e.g. `/lending`) with tabs/sections, or separate routes (`/borrow`, `/repay`, vault deposit) until unified. See [PRD.md](PRD.md) §11.3.

### Vault deposits (liquidity providers)

- Users **`deposit`** USDC into the hub **`LendingPool`** and receive **vault shares** (pro-rata claim on pool assets).
- **`withdraw(shares)`** burns shares and returns USDC **only up to idle liquidity**; if utilization is high, full withdrawal may **revert** until borrowers repay or new deposits arrive.
- **Borrow APR** and **supply APR** are **dynamic**: they depend on **utilization** \(borrowed / total assets\) via a kinked curve (see [PRD.md](PRD.md) §4.1 and [specs/vault-deposits.md](specs/vault-deposits.md)).
- Depositors earn from **interest paid by borrowers** (net of protocol fee), reflected in a rising **share price** / **exchange rate**.

### Liquidations (summary)

When **HF &lt; 1.0**, the hub **`AuctionLiquidationManager`** opens a **USDC auction per ACTIVE collateral** (`queueLiquidation`). Bidders call **`placeBid`**; late bids can **extend the deadline** (anti-sniping). If the borrower **cures** (HF ≥ 1), **`cancelAllAuctionsForBorrower`** refunds bids. After the deadline with at least one bid, **`claim`** settles: **debt share** goes to **`LendingPool`** via **`partialClearDebt`**, the **liquidation fee** (BPS of debt share) goes **directly to treasury**, **excess** over debt+fee is split between pool and treasury, and the **NFT** is released to the **winning bidder** via CCIP. Details: [specs/liquidation-auctions.md](specs/liquidation-auctions.md) and [PRD.md](PRD.md) §7.

### Card pricing (lock UI)

Before locking an NFT, the app should call **EXTERNAL_PRICE_API** (documented in [PRD.md](PRD.md) §5.1) for **USD value**, **suggested LTV**, and freshness fields. On-chain prices still come from the oracle / FDC path.

### Demo collectible NFT (`CardFiCollectible.sol`)

Admin can:

- `mint(to, tokenId)` — mint new tokens
- `setCardMetadata(tokenId, metadata)` — set/update per-token metadata

Metadata fields: `cardName`, `cardImage`, `setName`, `cardNumber`, `cardRarity`, `cardPrinting`. `tokenURI` returns base64-encoded JSON with these fields and an `attributes` array for marketplaces.

## Running the Full Flow

1. Start the app: `pnpm dev:frontend` and open the printed URL.
2. (Liquidity provider path) On the hub chain, approve USDC and call **`LendingPool.deposit(amount)`** when available; confirm shares and supply APR in the UI ([specs/vault-deposits.md](specs/vault-deposits.md)).
3. Connect wallet to Sepolia. Acquire demo collectible tokens from the deployed `CardFiCollectible` contract (admin mints to you or you receive from deployer).
4. Use **EXTERNAL_PRICE_API** (or mock) in the lock flow to show value and borrow preview; approve the CollateralAdapter to transfer your NFT, then call `lockAndNotify(tokenId, hubOwner)`. Pay the CCIP fee (ETH on Sepolia).
5. Wait for CCIP delivery (~few minutes). Check [CCIP Explorer](https://ccip.chain.link).
6. Set oracle price for the token if not already set (`setMockPrice` or FDC relay).
7. Switch to your configured hub chain (Arc Testnet or Arbitrum Sepolia). Call `LendingPool.borrow(amount)`.
8. To unlock: repay full debt with `LendingPool.repay(amount)`, then call `CollateralRegistry.initiateUnlock(collateralId)`.
9. Wait for UnlockCommand CCIP delivery. NFT is released to your address on Sepolia.
10. (LP path) **`withdraw(shares)`** when the pool has enough idle USDC.
