# Slab.Finance

Slab.Finance is a cross-chain lending protocol: borrow **USDC** on **Solana** against tokenized collectibles. Native Solana NFTs lock into the hub program; **EVM** collateral (e.g. **Polygon** / **Base**) locks via **LayerZero V2** into the same hub.

## How it works

1. **Lock** — On **Polygon** or **Base**, call the **`CollateralAdapterLayerZero`** `lockAndNotify` path (escrow in **`NFTVault`**, LZ message to Solana). Or lock **Solana-native** NFTs into hub PDAs when collections are allowlisted.
2. **Borrow** — On **Solana mainnet-beta**, borrow **USDC** against **ACTIVE** collateral once the hub oracle has priced it.
3. **Repay** — Repay in USDC on Solana; interest accrues per pool rules.
4. **Unlock** — After debt is cleared, complete the unlock flow (including any **LayerZero** return path to the source chain).

## Architecture

- **Hub (Solana)** — Anchor program **`slab_hub`**: lending, collateral registry, oracle, liquidation, native vaults, LayerZero receive.
- **Sources (EVM)** — **`protocolConfig.evmSources`**: e.g. **Polygon** (Courtyard integration id) and **Base** (Beezie), each with `chainId`, public `rpcUrl`, **LayerZero endpoint id**, and `contracts` (`collection`, `nftVault`, `collateralAdapterLayerZero`).

Configuration: [`shared/config/protocol.ts`](shared/config/protocol.ts). Shell exports: **`pnpm print:deploy-env`**. Sync addresses from deploy JSON: **`pnpm sync:protocol`**.

## Tech stack

- **Hub** — Anchor / Rust (`programs/slab_hub`)
- **EVM** — Solidity, Foundry, LayerZero OApp (`contracts/src/source/`)
- **App** — pnpm monorepo: Vite + React, NestJS backend, indexer, Prisma, **`@slabfinance/shared`**

## Quick start

1. Clone and **`pnpm install`** at the repo root.
2. Copy **`.env.example`** to **`.env`** and **`frontend/.env`**; set **`VITE_WALLETCONNECT_PROJECT_ID`**.
3. Run **`pnpm dev:frontend`** and connect **Solana** plus the EVM chain you use for locking.
4. Fill **`shared/config/protocol.ts`** (or run **`pnpm sync:protocol`** after writing `contracts/deployments/evm/*.json`).

Details: [SETUP.md](./SETUP.md), [DOCS.md](./DOCS.md).
