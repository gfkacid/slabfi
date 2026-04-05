# Slab.Finance CRE price oracle workflow

TypeScript [Chainlink CRE](https://docs.chain.link/cre) workflow: cron → HTTP fetch of **EXTERNAL_PRICE_API** → signed report → `OracleConsumer.onReport` on the hub chain.

## Prerequisites

- [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation) and a CRE account
- **Bun** 1.2.21+ (recommended by Chainlink for TypeScript workflows) or adjust install to your setup
- Hub chain supported by CRE **KeystoneForwarder** / simulation **MockKeystoneForwarder** (see [forwarder directory](https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts))

## Setup

1. Copy `config.json` and set `apiUrl`, `evms[0].oracleConsumerAddress`, `collection`, `tokenId`, `chainSelectorName`, and `gasLimit`.
2. Ensure the API response includes **`priceUsd`** as a string or number in **8 decimals** (same as on-chain `OracleConsumer`), or adjust `parsePriceFromBody` in `main.ts`.
3. Install dependencies: `bun install` or `npm install`.

## Simulate

From this directory:

```bash
cre workflow simulate . --target local-simulation --broadcast --non-interactive --trigger-index 0
```

Or from the monorepo root (installs `node_modules` in this folder if missing):

```bash
pnpm cre:simulate
```

Use `--broadcast` when you want simulation to submit `writeReport` to the chain. The Chainlink CRE CLI expects **`CRE_ETH_PRIVATE_KEY`** (64 hex chars, optional `0x` prefix). From the repo root, `pnpm cre:simulate` copies **`DEPLOYER_PRIVATE_KEY`** from your environment or repo-root `.env` into `CRE_ETH_PRIVATE_KEY` when the latter is missing or invalid.

**HTTP / 401:** Nest `GET /cards/:collection/:tokenId/price` is protected by **`SLABFI_API_KEY`** (`x-api-key`). The root script **`scripts/cre-simulate-local.sh`** defaults to a **local mock HTTP** response (`priceUsd` in 8 decimals) so `pnpm cre:simulate` works without the API. To exercise the real backend, set **`CRE_SIMULATE_USE_BACKEND=1`**, run Nest on `config.json`’s `apiUrl` host, and ensure **`SLABFI_API_KEY`** is set (env or repo `.env`); the script injects it into the workflow config when `apiKey` is empty.

## Deploy hub contract

Set `CRE_FORWARDER_ADDRESS` when running `Deploy_Hub.s.sol` to the **MockKeystoneForwarder** (simulation) or **KeystoneForwarder** (production) for your hub network, then call `setForwarderAddress` if you rotate keys or networks.
