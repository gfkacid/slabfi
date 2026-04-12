# Slab.Finance setup and deployment

From a clean clone to a running stack: **Solana** hub (`slab_hub` on mainnet-beta), **EVM** source contracts on **Polygon** and/or **Base** (LayerZero V2), MySQL, optional card catalog seed, and local app services.

For protocol mechanics and repo layout, see [DOCS.md](./DOCS.md).

---

## 1. Prerequisites

| Requirement | Notes |
|---------------|--------|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | `forge`, `cast` on `PATH` |
| Node.js 18+ and [pnpm](https://pnpm.io/) | Install from repo root |
| [jq](https://jqlang.org/) | Used by `scripts/deploy-all.sh` |
| MySQL 8+ | Local or hosted; no Docker Compose in-repo |
| Wallets funded | **Solana**: SOL on mainnet-beta for fees and LZ delivery. **Polygon**: MATIC. **Base**: ETH. |
| Reown / WalletConnect | [Project ID](https://dashboard.reown.com/) for `VITE_WALLETCONNECT_PROJECT_ID` |

Foundry remappings use LayerZero packages under [`contracts/lib/`](contracts/lib/). Run `pnpm install` at the repo root.

---

## 1b. One-command setup (recommended)

After MySQL is running and you have a root `.env` (see §2):

```bash
pnpm setup
```

This runs [`scripts/setup.sh`](scripts/setup.sh). It:

1. Runs **`pnpm install`**
2. Runs **`pnpm db:generate`** and **`pnpm db:push`**
3. Runs **`scripts/deploy-all.sh`** (prints `pnpm print:deploy-env`-style exports; does **not** auto-deploy contracts)
4. If **`contracts/deployments/evm/polygon.json`** or **`contracts/deployments/evm/base.json`** exists, runs **`scripts/sync-protocol-from-deployments.ts`** to patch [`shared/config/protocol.ts`](shared/config/protocol.ts) between `// @slabfi-sync:…` markers
5. If **`SEED_CARD_COLLECTION`** is set to a valid `0x` address, runs **`pnpm db:seed:cards`**

**Still manual after `pnpm setup`:** deploy the Solana program and each EVM stack, wire LayerZero peers, fund paths, configure oracle prices (§6), start dev servers (§8).

---

## 2. Install and environment

```bash
pnpm install
cp .env.example .env
cp .env.example frontend/.env
# or: ln -s ../.env frontend/.env
```

| Variable | Purpose |
|----------|---------|
| `DEPLOYER_PRIVATE_KEY` | EOA for `forge` on Polygon/Base. Never commit real keys. |
| `VITE_WALLETCONNECT_PROJECT_ID` | Wallet UI (`frontend/.env`). |
| `DATABASE_URL` | MySQL for Nest + indexer. |
| `SLABFI_API_KEY` | Optional; backend uses it for protected card price routes when set. |

**RPC overrides (optional):** `SOLANA_RPC_URL`, `POLYGON_RPC_URL`, `BASE_RPC_URL` — indexer and apps read these; defaults are in [`shared/config/protocol.ts`](shared/config/protocol.ts).

**Single source of truth for chain ids, LayerZero endpoint ids, program id, and contract addresses:** [`shared/config/protocol.ts`](shared/config/protocol.ts). After deploy JSON exists, run **`pnpm sync:protocol`**. See [DEPLOYMENTS.md](./DEPLOYMENTS.md).

---

## 3. Database

```bash
pnpm db:generate
pnpm db:push
# or: pnpm db:migrate
```

---

## 4. Deploy contracts

### Solana hub

```bash
cd programs/slab_hub
anchor build
anchor deploy --provider.cluster mainnet-beta
```

Put the program id in `protocol.ts` → `hub.programs.slabHub`.

### EVM source (per chain)

From repo root, inspect exports:

```bash
pnpm print:deploy-env
```

Then from `contracts/` (set env from your RPC provider and LayerZero docs):

```bash
cd contracts
# Example — Polygon; repeat for Base with BASE_* / chain 8453 / output deployments/evm/base.json
export LZ_ENDPOINT=<Polygon LayerZero Endpoint V2>
export LZ_DST_EID=30168
export COLLECTION=<ERC-721 collection>
export SOURCE_CHAIN_ID=137
export DEPLOYMENT_OUTPUT_FILE=deployments/evm/polygon.json
export NETWORK_KEY=polygon
forge script script/Deploy_EvmSourceLayerZero.s.sol:DeployEvmSourceLayerZero \
  --rpc-url "$POLYGON_RPC_URL" --broadcast --via-ir -vvv
```

Run **`pnpm sync:protocol`** so the indexer and frontend pick up `nftVault`, `collateralAdapterLayerZero`, and `collection`.

[`scripts/deploy-all.sh`](scripts/deploy-all.sh) prints the same high-level reminders and `print-deploy-env` output.

---

## 5. Configure the application

1. Ensure [`shared/config/protocol.ts`](shared/config/protocol.ts) has program id, `evmSources.*.contracts`, and `integrations` ids you use in the UI.
2. Rebuild shared if you edited it: **`pnpm build:shared`**
3. Restart the frontend after config or env changes.

---

## 6. LayerZero fees and oracle prices

- **EVM → Solana:** `_lzSend` pays **native gas** on the source chain (POL, ETH, etc.); Solana side needs **SOL** for rent and executor tips.
- **Oracle:** Collateral becomes **ACTIVE** after the hub oracle has a price for that key (see backend / program docs).

---

## 7. Seed the card catalog (optional)

1. Set `SEED_CARD_COLLECTION` in `.env` to the **Polygon** collection address used in Courtyard (must match `protocolConfig.evmSources.polygon.contracts.collection` when you use that integration).
2. Optionally set `PRICECHARTING_ID_*` for PriceCharting lookups.
3. Run:

```bash
pnpm db:seed:cards
```

---

## 8. Run the stack

Requires `DATABASE_URL` and populated **`shared/config/protocol.ts`**.

```bash
pnpm dev:frontend   # http://localhost:3000
pnpm dev:backend    # http://localhost:3001
pnpm dev:indexer    # Solana hub tick + EVM source polls → MySQL
```

Or:

```bash
pnpm dev
```

Production build:

```bash
pnpm run build
```

---

## 9. Verify

```bash
pnpm print:deploy-env
# Solana: solana account / Anchor CLI for program accounts
# EVM: cast call against NFTVault / CollateralAdapterLayerZero on each chain
```

**API** — Swagger UI: `http://localhost:3001/api`.

---

## 10. End-to-end checklist

1. Start backend + indexer + frontend; ensure oracle prices and LZ paths are funded.
2. **Liquidity** — Deposit USDC into the Solana pool per program / UI.
3. **Collateral** — Hold NFTs on **Polygon** or **Base** (per integration).
4. **Lock** — Approve the adapter, call `lockAndNotify`, pay native gas for LayerZero. Track [LayerZero Scan](https://layerzeroscan.com/).
5. **Borrow** — On Solana, borrow USDC against registered collateral.
6. **Repay / unlock** — Repay on Solana; complete unlock / LayerZero delivery per program and adapter configuration.

More detail: [DOCS.md](./DOCS.md).
