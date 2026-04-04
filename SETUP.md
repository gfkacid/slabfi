# Slab.Finance setup and deployment

End-to-end steps from a clean clone to a running protocol: contracts on **Arc Testnet** (hub) and **Ethereum Sepolia** (source), MySQL, optional card catalog seed, and local app services.

For protocol mechanics, CCIP details, and specs, see [DOCS.md](./DOCS.md).

---

## 1. Prerequisites

| Requirement | Notes |
|---------------|--------|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | `forge`, `cast` on `PATH` |
| Node.js 18+ and [pnpm](https://pnpm.io/) | Install deps from repo root |
| [jq](https://jqlang.org/) | Used by `scripts/deploy-all.sh` |
| MySQL 8+ | Local or hosted; no Docker Compose in-repo |
| Wallets funded on both chains | **Arc**: native USDC as gas ([Circle faucet](https://faucet.circle.com)). **Sepolia**: ETH ([Sepolia faucet](https://sepoliafaucet.com)) |
| Reown / WalletConnect | [Project ID](https://dashboard.reown.com/) for `VITE_WALLETCONNECT_PROJECT_ID` |

From the repo root, `pnpm install` pulls workspace packages. Foundry remappings expect Chainlink packages under **repo root** `node_modules` (root `package.json` devDependencies).

---

## 1b. One-command setup (recommended)

After MySQL is running and you have a root `.env` (see §2), run everything through install, database, contract deploy, **CRE**, and **`shared/config/testnet.ts` sync**:

```bash
pnpm setup
```

This executes [`scripts/setup.sh`](scripts/setup.sh). It **preflights** all required tools and env vars (prints everything missing, then exits). It then:

1. Runs **`pnpm install`**
2. Runs **`pnpm db:generate`** and **`pnpm db:push`**
3. Runs **`scripts/deploy-all.sh`** with **`DEPLOY_CRE_WORKFLOW=1`** and **`FAIL_ON_CRE_FAILURE=1`** (CRE must succeed or the script fails)
4. Runs **`scripts/sync-testnet-from-deployments.ts`** to write deployment addresses into the marked regions of [`shared/config/testnet.ts`](shared/config/testnet.ts)
5. If **`SEED_CARD_COLLECTION`** is set to a valid `0x` address, runs **`pnpm db:seed:cards`**

**Tools on `PATH`:** `node`, `pnpm`, `forge`, `cast`, `jq`, **`cre`** (Chainlink CRE CLI), **`npm`** (for `cre/price-oracle` install inside `deploy-all.sh`).

**Still manual after `pnpm setup`:** fund the hub CCIP router (§6), set oracle prices / wait for CRE (§6), start dev servers (§8), optional verification (§9). The script prints a short reminder at the end.

---

## 2. Install and environment

```bash
pnpm install
cp .env.example .env
# Vite reads frontend/.env — copy or symlink:
cp .env.example frontend/.env
# or: ln -s ../.env frontend/.env
```

**Required for deploy + app**

| Variable | Purpose |
|----------|---------|
| `DEPLOYER_PRIVATE_KEY` | EOA for `forge` on Arc and Sepolia (gas on both chains). Never commit real keys. |
| `VITE_WALLETCONNECT_PROJECT_ID` | Wallet UI (in `frontend/.env` or symlinked root `.env`). |
| `DATABASE_URL` | MySQL URL for Nest + indexer, e.g. `mysql://user:pass@127.0.0.1:3306/slabfinance`. |

**Common optional**

| Variable | Purpose |
|----------|---------|
| `PORT` | Backend (default `3001`). |
| `VITE_API_BASE` | Backend base URL for the SPA (default dev: `http://localhost:3001`). |
| `PRICECHARTING_API_KEY` | Card valuations / PriceCharting integration in the API. |
| `SLABFI_API_KEY` | Protects `GET /cards/:collection/:tokenId/price` (CRE and `deploy-all.sh` generated config). **Required for `pnpm setup`.** |
| `CRE_API_KEY` | Non-interactive auth for the CRE CLI. **Required for `pnpm setup`.** |
| `INDEXER_POLL_INTERVAL_MS`, `INDEXER_LOG_CHUNK_SIZE` | Indexer tuning. |

**Chain RPCs, CCIP routers/selectors, CRE forwarder, and deployed contract addresses** are not-only-in-env: the single source of truth is [`shared/config/testnet.ts`](shared/config/testnet.ts). After **`pnpm setup`**, contract fields are filled automatically from `contracts/deployments/*.json` (see §5). If you only run `deploy-all.sh`, paste addresses manually or run `scripts/sync-testnet-from-deployments.ts` yourself.

---

## 3. Database

1. Create a database (e.g. `slabfinance`).
2. Set `DATABASE_URL` in `.env`.
3. From repo root:

```bash
pnpm db:generate
pnpm db:push
# or tracked migrations: pnpm db:migrate
```

---

## 4. Deploy contracts

Hub must deploy before source; the source stack needs the hub `CCIPMessageRouter` address.

### Option A — full repo setup (`pnpm setup`)

Use [§1b](#1b-one-command-setup-recommended): **`pnpm setup`** (wraps `scripts/setup.sh`). This includes install, DB push, deploy, **mandatory CRE**, and syncing [`shared/config/testnet.ts`](shared/config/testnet.ts).

### Option B — deploy contracts only (`deploy-all.sh`)

Set `DEPLOYER_PRIVATE_KEY` in `.env`. From repo root:

```bash
chmod +x scripts/deploy-all.sh
./scripts/deploy-all.sh
```

This runs:

1. **Phase 1 (Arc)** — `forge script script/Deploy_Hub.s.sol:DeployHub` → writes [`contracts/deployments/hub.json`](contracts/deployments/hub.json).
2. **Phase 2 (Sepolia)** — `Deploy_SourceChain.s.sol:DeploySourceChain` → [`contracts/deployments/eth-sepolia.json`](contracts/deployments/eth-sepolia.json).
3. **Phase 3 (Arc)** — `Configure_Hub_Adapters.s.sol:ConfigureHubAdapters` registers the Sepolia adapter on the hub.

It also writes **[`DEPLOYMENTS.md`](DEPLOYMENTS.md)** with addresses and a TypeScript snippet for `testnet.ts`.

**Optional CRE workflow** (after hub + Sepolia): set `DEPLOY_CRE_WORKFLOW=1`, install the Chainlink CRE CLI (`cre`) on `PATH`, set `CRE_API_KEY`. Optionally override the price URL with `EXTERNAL_PRICE_API_URL` and token id with `CRE_PRICE_TOKEN_ID`. If the CLI step fails, hub/source deploys may still succeed; check script output. To fail the script when CRE does not complete, set **`FAIL_ON_CRE_FAILURE=1`** (as `pnpm setup` does).

### Option C — manual (mirror of the script)

From `contracts/` after exporting env from config:

```bash
cd contracts
eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
export HUB_DEPLOYMENT_OUTPUT=deployments/hub.json
forge script script/Deploy_Hub.s.sol:DeployHub --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir -vvv
```

Read `ccipMessageRouter` from `deployments/hub.json`, then:

```bash
eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
export HUB_CCIP_ROUTER_ADDRESS=<ccipMessageRouter_from_hub.json>
export HUB_CHAIN_SELECTOR="$ARC_CHAIN_SELECTOR"
export SOURCE_CCIP_ROUTER="$CCIP_ROUTER_SEPOLIA"
export SOURCE_CHAIN_SELECTOR="$SEPOLIA_CHAIN_SELECTOR"
export DEPLOYMENT_OUTPUT_FILE=deployments/eth-sepolia.json
export SOURCE_NETWORK_NAME=ethereum-sepolia
forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$SEPOLIA_RPC" --broadcast --via-ir -vvv
```

Then register the adapter (use `collateralRegistry` from hub JSON and `collateralAdapter` from Sepolia JSON):

```bash
export COLLATERAL_REGISTRY_ADDRESS=<collateralRegistry_from_hub.json>
export SEPOLIA_ADAPTER_ADDRESS=<collateralAdapter_from_eth-sepolia.json>
forge script script/Configure_Hub_Adapters.s.sol:ConfigureHubAdapters --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir -vvv
```

You can also register via `cast` as in [DOCS.md](./DOCS.md#step-3-register-adapter-on-hub) if you prefer.

---

## 5. Configure the application

If you used **`pnpm setup`**, [`shared/config/testnet.ts`](shared/config/testnet.ts) is already updated from `contracts/deployments/hub.json` and `eth-sepolia.json` via [`scripts/sync-testnet-from-deployments.ts`](scripts/sync-testnet-from-deployments.ts) (regions between `// @slabfi-sync:…` comments).

Otherwise, copy addresses into `testnet.ts` under `hub.contracts` and `source.contracts` (include **`nftVault`** for the indexer). The generated **`DEPLOYMENTS.md`** includes a ready-to-paste snippet; or read the deployment JSON files directly. You can also run `pnpm --filter @slabfinance/indexer exec tsx ../scripts/sync-testnet-from-deployments.ts` from the repo root (same as the indexer-relative path used in `deploy-all.sh`).

Restart the frontend after changing `testnet.ts` or env files. After syncing, rebuild shared if needed: `pnpm build:shared`.

---

## 6. Fund CCIP and set oracle prices

**Outbound CCIP on Arc** — The hub `CCIPMessageRouter` needs native USDC for outbound messages (e.g. unlock). On Arc, native currency is USDC; send a small amount to the router address (see [DOCS.md](./DOCS.md#step-4-fund-ccip-router) for `cast send` with `--value`).

**Prices** — Collateral moves to ACTIVE after `OracleConsumer` has a price. For development, use `setMockPrice(collection, tokenId, price)` (price is **8 decimals**, e.g. `$150` → `15000000000`). Use addresses from **`DEPLOYMENTS.md`**, `hub.json` / `eth-sepolia.json`, or `shared/config/testnet.ts` after §5:

```bash
cd contracts
eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
cast send <oracleConsumer_proxy> \
  "setMockPrice(address,uint256,uint256)" \
  <cardFiCollectible_on_Sepolia> 1 15000000000 \
  --rpc-url "$ARC_TESTNET_RPC" \
  --private-key "$DEPLOYER_PRIVATE_KEY"
```

Repeat per token id as needed. Production path: Chainlink CRE + [`cre/price-oracle/`](cre/price-oracle/) (forwarder in `testnet.ts` → `cre.forwarderAddress`).

---

## 7. Seed the card catalog (optional)

Upserts `Card` rows from [`scripts/data/cardFi-collectibles-metadata.stub.json`](scripts/data/cardFi-collectibles-metadata.stub.json) (token ids `1..N` by row order).

1. Set `SEED_CARD_COLLECTION` in `.env` to your deployed **CardFiCollectible** address on Sepolia (`0x...`).
2. Optionally set `PRICECHARTING_ID_1`, `PRICECHARTING_ID_2`, … for PriceCharting lookups.
3. Run:

```bash
pnpm db:seed:cards
```

**Related (on-chain, not DB):** `pnpm mint:collectibles` runs [`scripts/mint-cardfi-collectibles.ts`](scripts/mint-cardfi-collectibles.ts) against the address in `testnet.ts`; use when you need additional mints, not for Prisma seeding.

---

## 8. Run the stack

Requires `DATABASE_URL` and populated `shared/config/testnet.ts` for indexer/frontend.

```bash
pnpm dev:frontend   # http://localhost:3000
pnpm dev:backend    # http://localhost:3001
pnpm dev:indexer    # polls chains → MySQL
```

Or frontend + backend together:

```bash
pnpm dev
```

Production build:

```bash
pnpm run build
```

---

## 9. Verify

`print-deploy-env.ts` exports RPCs and chain selectors only; substitute **hub contract addresses** from `shared/config/testnet.ts` or `contracts/deployments/hub.json`:

```bash
cd contracts
eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
cast call <lendingPool_proxy> "totalAssets()" --rpc-url "$ARC_TESTNET_RPC"
cast call <ccipMessageRouter_app> "collateralRegistry()" --rpc-url "$ARC_TESTNET_RPC"
cast call <ccipMessageRouter_app> "trustedAdapters(uint64)" "$SEPOLIA_CHAIN_SELECTOR" --rpc-url "$ARC_TESTNET_RPC"
```

**API** — Swagger UI: `http://localhost:3001/api`.

---

## 10. End-to-end flow (checklist)

1. Start backend + indexer + frontend; ensure oracle prices and CCIP funding are set.
2. **Liquidity** — On Arc, deposit USDC into the lending pool when the deployed ABI exposes the current deposit entrypoint (see [DOCS.md](./DOCS.md) PRD / vault specs).
3. **Collateral** — On Sepolia, hold demo `CardFiCollectible` tokens (deploy script mints samples; admin can mint more).
4. **Lock** — Approve the collateral adapter, call `lockAndNotify`, pay CCIP fee (ETH on Sepolia). Track the transfer on [CCIP Explorer](https://ccip.chain.link).
5. **Price** — Ensure oracle has a price for that collection/token (mock or CRE).
6. **Borrow** — On Arc, borrow USDC against registered collateral.
7. **Repay / unlock** — Repay debt, then `initiateUnlock` on the hub; wait for unlock CCIP to Sepolia.

More detail: [DOCS.md § Running the Full Flow](./DOCS.md#running-the-full-flow).
