# Slab.Finance

Slab.Finance is a cross-chain lending protocol that lets you borrow USDC against tokenized collectibles (e.g., trading cards) used as collateral. Lock your NFTs on one chain, borrow on another.

## How It Works

1. **Lock** — Lock your collectible NFT on Ethereum Sepolia. The NFT is escrowed in a vault and a message is sent via Chainlink CCIP to the hub chain.
2. **Borrow** — On Arc Testnet, borrow USDC against your locked collateral. Your borrow limit is based on the oracle-attested value of your NFTs and tier-based LTV (loan-to-value) ratios.
3. **Repay** — Repay your loan (partial or full) in USDC. Interest accrues at a fixed rate (8% APR).
4. **Unlock** — Once your debt is fully repaid, initiate unlock. The protocol sends a CCIP message back to Sepolia and your NFT is released to your wallet.

## Architecture

- **Hub chain (Arc Testnet)** — Lending pool, collateral registry, oracle consumer, health factor engine, liquidation manager. All accounting and USDC live here.
- **Source chain (Ethereum Sepolia)** — NFT vault and collateral adapter. Your collectibles are locked here and messages are sent to/from the hub via CCIP.

The only CCIP lane available for Arc Testnet at the moment is Arc ↔ Ethereum Sepolia, so the protocol uses Sepolia as the source chain for collateral.

## Key Features

- **Oracle-based pricing** — Collateral values come from Chainlink CRE workflows (KeystoneForwarder → `OracleConsumer.onReport`) or admin `setMockPrice` for dev. Tier-based LTV: 40% (high liquidity), 25% (medium), 15% (illiquid).
- **Health factor** — Your position is HEALTHY (HF ≥ 1.30), WARNING (1.00–1.30), or LIQUIDATABLE (HF < 1.00). New borrows are disabled in WARNING.
- **Liquidation** — If HF drops below 1.0, your position enters a 6-hour liquidation queue. Liquidators can repay your debt (minus 15% bonus) and receive the NFT after the delay. You can cure the position by repaying or adding collateral before execution.

## Tech Stack

- **Smart contracts** — Solidity, Foundry, OpenZeppelin, Chainlink CCIP
- **App** — pnpm monorepo: Vite + React frontend, NestJS backend (skeleton), shared TypeScript package; Reown AppKit, Wagmi, Viem
- **Oracle** — Chainlink CRE (see [`cre/price-oracle/`](cre/price-oracle/)), Chainlink Automation for health factor sweeps

## Quick Start

1. Clone the repo and run `pnpm install` at the repo root.
2. Copy `.env.example` to `frontend/.env` (or symlink) and set `VITE_WALLETCONNECT_PROJECT_ID`. Deployed contract addresses and chain RPCs live in [`shared/config/testnet.ts`](shared/config/testnet.ts).
3. Run `pnpm dev:frontend` and connect your wallet to Arc Testnet and Sepolia.
4. Get testnet USDC on Arc (faucet) and demo collectible NFTs on Sepolia (mint via admin or receive from deployer).
5. Lock an NFT on Sepolia, then borrow USDC on Arc.

For detailed setup and deployment, see [DOCS.md](./DOCS.md).
