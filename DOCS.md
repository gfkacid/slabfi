# Slab.Finance Developer Documentation

Protocol reference for developers: repository layout, environment, deployment order, verification, mechanics (CCIP, collateral lifecycle, health factor, lending UI, liquidations), and end-to-end flow.

For a focused deployment and local stack walkthrough, see **[SETUP.md](./SETUP.md)**.

## Repository layout

The repo is a **pnpm workspace** with these main areas:

| Path | Purpose |
|------|---------|
| [`contracts/`](contracts/) | Solidity / Foundry — hub and source deployments, tests |
| [`frontend/`](frontend/) | **Vite + React** SPA — wallet UI (Reown AppKit, Wagmi, Viem) |
| [`backend/`](backend/) | **NestJS** REST API — protocol stats, positions, auctions, collateral, activity (reads **MySQL** populated by the indexer) |
| [`indexer/`](indexer/) | **TypeScript** service — polls hub + source chains, writes events and snapshots to **MySQL** |
| [`prisma/`](prisma/) | Shared **Prisma** schema for backend + indexer |
| [`shared/`](shared/) | **`@slabfinance/shared`** — types, constants (ABIs, chain id, status labels), and **[`shared/config/testnet.ts`](shared/config/testnet.ts)** (hub Arc Testnet + source Ethereum Sepolia: RPCs, CCIP, contract addresses) |
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
pnpm dev:indexer  # Chain indexer → MySQL (set `DATABASE_URL`; contract addresses in shared/config/testnet.ts)
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

1. Copy the example env file (Vite reads **`frontend/.env`** when developing the SPA):

   ```bash
   cp .env.example frontend/.env
   ```

2. Set **`VITE_WALLETCONNECT_PROJECT_ID`**, **`DATABASE_URL`**, and (for deploys) **`DEPLOYER_PRIVATE_KEY`**. Optional: **`VITE_EXTERNAL_PRICE_API_BASE`**, **`PORT`**, **`INDEXER_POLL_INTERVAL_MS`**, **`INDEXER_LOG_CHUNK_SIZE`**.

### Chain and contract configuration

**Hub chain:** Arc Testnet. **Source chain:** Ethereum Sepolia.

RPC URLs, CCIP routers and selectors, CRE forwarder placeholder, and **all deployed contract addresses** for the frontend, indexer, and backend live in **[`shared/config/testnet.ts`](shared/config/testnet.ts)**. After deploying, paste addresses there (or copy the snippet from `DEPLOYMENTS.md` when using [`scripts/deploy-all.sh`](scripts/deploy-all.sh)).

Forge scripts receive RPCs and CCIP values via **`scripts/print-deploy-env.ts`** (invoked automatically by `deploy-all.sh`).

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

The SPA uses **Arc Testnet** for lending and **Ethereum Sepolia** for locking NFTs (see [`frontend/src/lib/hub.ts`](frontend/src/lib/hub.ts), [`frontend/src/lib/chains.ts`](frontend/src/lib/chains.ts)). Chain metadata and addresses come from **`testnetConfig`** in **`@slabfinance/shared`**.

**Fund CCIP outbound fees:** On Arc, send native USDC to `CCIPMessageRouter`. On Ethereum Sepolia, pay CCIP fees in ETH (or a supported fee token per [Chainlink CCIP docs](https://docs.chain.link/ccip)).

For `cast` examples below, use the hub RPC from **`shared/config/testnet.ts`** (`hub.rpcUrl`) or export it via `eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"` from the `contracts/` directory (sets `ARC_TESTNET_RPC`).

## Deployment Order

Hub contracts must be deployed before source chain contracts (the adapter needs the hub router address).

### Step 1: Deploy Hub (Arc Testnet)

```bash
cd contracts
eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
forge script script/Deploy_Hub.s.sol --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir
```

This deploys:

- MockUSDC (1M minted); `OracleConsumer` initialized with `CRE_FORWARDER_ADDRESS` from **`shared/config/testnet.ts`** (`cre.forwarderAddress`, exported by `print-deploy-env.ts` — use real KeystoneForwarder + [`cre/price-oracle/`](cre/price-oracle/) for production paths)
- OracleConsumer, CollateralRegistry, LendingPool, AuctionLiquidationManager, HealthFactorEngine (UUPS proxies)
- CCIPMessageRouter, ChainlinkAutomationKeeper
- May seed initial USDC liquidity (implementation-specific). Anyone can add liquidity afterward via the pool’s public **`deposit`** once that function exists on chain.

**Save the `CCIPMessageRouter` address** — you need it for Step 2.

### Step 2: Deploy Source Chain (Ethereum Sepolia)

Set `HUB_CCIP_ROUTER_ADDRESS` to the CCIPMessageRouter address from Step 1 and `HUB_CHAIN_SELECTOR` to the Arc CCIP selector (same as `ARC_CHAIN_SELECTOR` from `testnetConfig`).

```bash
eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
export HUB_CCIP_ROUTER_ADDRESS=<CCIPMessageRouter_address_from_step_1>
export HUB_CHAIN_SELECTOR=$ARC_CHAIN_SELECTOR
export SOURCE_CCIP_ROUTER=$CCIP_ROUTER_SEPOLIA
export SOURCE_CHAIN_SELECTOR=$SEPOLIA_CHAIN_SELECTOR
export DEPLOYMENT_OUTPUT_FILE=deployments/eth-sepolia.json
export SOURCE_NETWORK_NAME=ethereum-sepolia
forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$SEPOLIA_RPC" --broadcast --via-ir
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

### Step 6: Configure the app

Add the deployed addresses to **[`shared/config/testnet.ts`](shared/config/testnet.ts)** under `hub.contracts` and `source.contracts` (including `nftVault` for the indexer). Set **`VITE_WALLETCONNECT_PROJECT_ID`** in `.env` / `frontend/.env`.

Restart `pnpm dev:frontend` after changing config or env files.

## Post-Deployment Verification

Export `ARC_TESTNET_RPC` (and addresses) from **`shared/config/testnet.ts`** via `print-deploy-env.ts`, or paste the hub RPC from that file into `--rpc-url`.

```bash
eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
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

Before locking an NFT, the app should call **EXTERNAL_PRICE_API** (documented in [PRD.md](PRD.md) §5.1) for **USD value**, **suggested LTV**, and freshness fields. On-chain prices still come from **OracleConsumer** (Chainlink CRE workflow or admin `setMockPrice`).

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
6. Set oracle price for the token if not already set (`setMockPrice` or the [`cre/price-oracle/`](cre/price-oracle/) CRE workflow after configuring the forwarder).
7. Switch to **Arc Testnet** (hub). Call `LendingPool.borrow(amount)`.
8. To unlock: repay full debt with `LendingPool.repay(amount)`, then call `CollateralRegistry.initiateUnlock(collateralId)`.
9. Wait for UnlockCommand CCIP delivery. NFT is released to your address on Sepolia.
10. (LP path) **`withdraw(shares)`** when the pool has enough idle USDC.
