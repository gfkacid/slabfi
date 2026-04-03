#!/usr/bin/env bash
# Deploy CardFi hub on Arc, source stacks on Ethereum Sepolia + Arbitrum Sepolia, register adapters, write DEPLOYMENTS.md.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS="$REPO_ROOT/contracts"
HUB_JSON="$CONTRACTS/deployments/hub.json"
SEPOLIA_JSON="$CONTRACTS/deployments/eth-sepolia.json"
ARB_JSON="$CONTRACTS/deployments/arbitrum-sepolia.json"
DEPLOYMENTS_MD="$REPO_ROOT/DEPLOYMENTS.md"

if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

required_vars=(
  DEPLOYER_PRIVATE_KEY
  ARC_TESTNET_RPC
  SEPOLIA_RPC
  ARBITRUM_SEPOLIA_RPC
  CCIP_ROUTER_ARC
  CCIP_ROUTER_SEPOLIA
  CCIP_ROUTER_ARBITRUM_SEPOLIA
  ARC_CHAIN_SELECTOR
  SEPOLIA_CHAIN_SELECTOR
  ARBITRUM_SEPOLIA_CHAIN_SELECTOR
)

for v in "${required_vars[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "Missing required env var: $v" >&2
    exit 1
  fi
done

command -v forge >/dev/null 2>&1 || {
  echo "forge (Foundry) is not on PATH" >&2
  exit 1
}
command -v jq >/dev/null 2>&1 || {
  echo "jq is not on PATH" >&2
  exit 1
}

# Read string or number from JSON (flat or under .hub / .source)
json_get() {
  local file="$1"
  local key="$2"
  jq -r --arg k "$key" '.[$k] // .hub[$k] // .source[$k] | if . == null then empty else tostring end' "$file"
}

mkdir -p "$CONTRACTS/deployments"
cd "$CONTRACTS"

export HUB_DEPLOYMENT_OUTPUT="deployments/hub.json"

echo "=== Phase 1: Deploy hub on Arc testnet ==="
forge script script/Deploy_Hub.s.sol:DeployHub --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir -vvv

HUB_ROUTER="$(json_get "$HUB_JSON" ccipMessageRouter)"
REGISTRY="$(json_get "$HUB_JSON" collateralRegistry)"
if [[ -z "$HUB_ROUTER" || -z "$REGISTRY" ]]; then
  echo "Failed to read hub addresses from $HUB_JSON" >&2
  exit 1
fi

export HUB_CCIP_ROUTER_ADDRESS="$HUB_ROUTER"
export HUB_CHAIN_SELECTOR="${HUB_CHAIN_SELECTOR:-$ARC_CHAIN_SELECTOR}"

echo "=== Phase 2: Deploy source chain on Ethereum Sepolia ==="
export SOURCE_CCIP_ROUTER="$CCIP_ROUTER_SEPOLIA"
export SOURCE_CHAIN_SELECTOR="$SEPOLIA_CHAIN_SELECTOR"
export DEPLOYMENT_OUTPUT_FILE="deployments/eth-sepolia.json"
export SOURCE_NETWORK_NAME="ethereum-sepolia"
forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$SEPOLIA_RPC" --broadcast --via-ir -vvv

echo "=== Phase 3: Deploy source chain on Arbitrum Sepolia ==="
export SOURCE_CCIP_ROUTER="$CCIP_ROUTER_ARBITRUM_SEPOLIA"
export SOURCE_CHAIN_SELECTOR="$ARBITRUM_SEPOLIA_CHAIN_SELECTOR"
export DEPLOYMENT_OUTPUT_FILE="deployments/arbitrum-sepolia.json"
export SOURCE_NETWORK_NAME="arbitrum-sepolia"
forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$ARBITRUM_SEPOLIA_RPC" --broadcast --via-ir -vvv

SEPOLIA_ADAPTER="$(json_get "$SEPOLIA_JSON" collateralAdapter)"
ARB_ADAPTER="$(json_get "$ARB_JSON" collateralAdapter)"
if [[ -z "$SEPOLIA_ADAPTER" || -z "$ARB_ADAPTER" ]]; then
  echo "Failed to read adapter addresses from source deployment JSON" >&2
  exit 1
fi

export COLLATERAL_REGISTRY_ADDRESS="$REGISTRY"
export SEPOLIA_ADAPTER_ADDRESS="$SEPOLIA_ADAPTER"
export ARBITRUM_SEPOLIA_ADAPTER_ADDRESS="$ARB_ADAPTER"

echo "=== Phase 4: Register adapters on hub (Arc) ==="
forge script script/Configure_Hub_Adapters.s.sol:ConfigureHubAdapters --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir -vvv

TS="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

STATIC_GUIDE="$(cat <<'GUIDE_EOF'
## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`)
- `jq`
- Node dependencies for CCIP contracts: from repo root run `pnpm install` (or `npm install`) so `contracts/node_modules` or root `node_modules` resolves `@chainlink/contracts-ccip` per `contracts/foundry.toml`
- Native currency on Arc, Ethereum Sepolia, and Arbitrum Sepolia testnets for gas (and LINK or native CCIP fees on source chains when locking NFTs)

## One-command deployment

From the repository root, with `.env` filled in (see table below):

```bash
chmod +x scripts/deploy-all.sh
./scripts/deploy-all.sh
```

This runs, in order: hub on Arc, source stack on Sepolia, source stack on Arbitrum Sepolia, then hub configuration to trust both adapters.

## Manual step-by-step (same order as the script)

1. **Hub (Arc)** — writes `contracts/deployments/hub.json`:

   ```bash
   cd contracts
   export HUB_DEPLOYMENT_OUTPUT=deployments/hub.json
   forge script script/Deploy_Hub.s.sol:DeployHub --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir
   ```

2. **Set hub router address** for source scripts (from `hub.json` or logs):

   ```bash
   export HUB_CCIP_ROUTER_ADDRESS=<ccipMessageRouter from hub.json>
   export HUB_CHAIN_SELECTOR=$ARC_CHAIN_SELECTOR
   ```

3. **Ethereum Sepolia**:

   ```bash
   export SOURCE_CCIP_ROUTER=$CCIP_ROUTER_SEPOLIA
   export SOURCE_CHAIN_SELECTOR=$SEPOLIA_CHAIN_SELECTOR
   export DEPLOYMENT_OUTPUT_FILE=deployments/eth-sepolia.json
   export SOURCE_NETWORK_NAME=ethereum-sepolia
   forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$SEPOLIA_RPC" --broadcast --via-ir
   ```

4. **Arbitrum Sepolia**:

   ```bash
   export SOURCE_CCIP_ROUTER=$CCIP_ROUTER_ARBITRUM_SEPOLIA
   export SOURCE_CHAIN_SELECTOR=$ARBITRUM_SEPOLIA_CHAIN_SELECTOR
   export DEPLOYMENT_OUTPUT_FILE=deployments/arbitrum-sepolia.json
   export SOURCE_NETWORK_NAME=arbitrum-sepolia
   forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$ARBITRUM_SEPOLIA_RPC" --broadcast --via-ir
   ```

5. **Register adapters on Arc** (owner / admin = deployer):

   ```bash
   export COLLATERAL_REGISTRY_ADDRESS=<collateralRegistry from hub.json>
   export SEPOLIA_ADAPTER_ADDRESS=<collateralAdapter from eth-sepolia.json>
   export ARBITRUM_SEPOLIA_ADAPTER_ADDRESS=<collateralAdapter from arbitrum-sepolia.json>
   forge script script/Configure_Hub_Adapters.s.sol:ConfigureHubAdapters --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir
   ```

## Verification (examples)

Replace addresses with values from the tables below.

```bash
# Hub — registry and CCIP router
cast call <COLLATERAL_REGISTRY> "ccipRouter()(address)" --rpc-url "$ARC_TESTNET_RPC"
cast call <CCIP_MESSAGE_ROUTER> "trustedAdapters(uint64)(address)" $SEPOLIA_CHAIN_SELECTOR --rpc-url "$ARC_TESTNET_RPC"

# Source — adapter points at hub
cast call <SEPOLIA_ADAPTER> "hubRouter()(address)" --rpc-url "$SEPOLIA_RPC"
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DEPLOYER_PRIVATE_KEY` | Same EOA used on all three chains (must hold gas on Arc, Sepolia, Arbitrum Sepolia) |
| `ARC_TESTNET_RPC` | Arc testnet JSON-RPC |
| `SEPOLIA_RPC` | Ethereum Sepolia JSON-RPC |
| `ARBITRUM_SEPOLIA_RPC` | Arbitrum Sepolia JSON-RPC |
| `CCIP_ROUTER_ARC` | Chainlink CCIP router on Arc (passed to `CCIPMessageRouter` constructor) |
| `CCIP_ROUTER_SEPOLIA` | CCIP router on Ethereum Sepolia |
| `CCIP_ROUTER_ARBITRUM_SEPOLIA` | CCIP router on Arbitrum Sepolia |
| `ARC_CHAIN_SELECTOR` | CCIP chain selector for Arc (hub) |
| `SEPOLIA_CHAIN_SELECTOR` | CCIP chain selector for Ethereum Sepolia |
| `ARBITRUM_SEPOLIA_CHAIN_SELECTOR` | CCIP chain selector for Arbitrum Sepolia |
| `CCIP_ROUTER_HUB` | Optional; if set, used instead of `CCIP_ROUTER_ARC` in `Deploy_Hub` |
| `HUB_DEPLOYMENT_OUTPUT` | Optional; default `deployments/hub.json` (relative to `contracts/`) |

After deployment, set frontend / indexer addresses using the **Application config** section below.
GUIDE_EOF
)"

ORACLE="$(json_get "$HUB_JSON" oracleConsumer)"
POOL="$(json_get "$HUB_JSON" lendingPool)"
LIQ="$(json_get "$HUB_JSON" auctionLiquidationManager)"
HF="$(json_get "$HUB_JSON" healthFactorEngine)"
USDC="$(json_get "$HUB_JSON" mockUsdc)"
KEEPER="$(json_get "$HUB_JSON" chainlinkAutomationKeeper)"
CCIP_ONCHAIN="$(json_get "$HUB_JSON" ccipRouterOnChain)"

SEP_COLL="$(json_get "$SEPOLIA_JSON" cardFiCollectible)"
SEP_VAULT="$(json_get "$SEPOLIA_JSON" nftVault)"
ARB_COLL="$(json_get "$ARB_JSON" cardFiCollectible)"
ARB_VAULT="$(json_get "$ARB_JSON" nftVault)"

cat >"$DEPLOYMENTS_MD" <<EOF
# CardFi deployments

_Generated: ${TS}_ (re-run \`scripts/deploy-all.sh\` to refresh.)

## Networks

| Network | RPC env | CCIP chain selector env | CCIP router env |
|---------|---------|---------------------------|-----------------|
| Arc (hub) | \`ARC_TESTNET_RPC\` | \`ARC_CHAIN_SELECTOR\` | \`CCIP_ROUTER_ARC\` |
| Ethereum Sepolia | \`SEPOLIA_RPC\` | \`SEPOLIA_CHAIN_SELECTOR\` | \`CCIP_ROUTER_SEPOLIA\` |
| Arbitrum Sepolia | \`ARBITRUM_SEPOLIA_RPC\` | \`ARBITRUM_SEPOLIA_CHAIN_SELECTOR\` | \`CCIP_ROUTER_ARBITRUM_SEPOLIA\` |

| Network | Chain selector value |
|---------|------------------------|
| Arc | ${ARC_CHAIN_SELECTOR} |
| Ethereum Sepolia | ${SEPOLIA_CHAIN_SELECTOR} |
| Arbitrum Sepolia | ${ARBITRUM_SEPOLIA_CHAIN_SELECTOR} |

## Hub contracts (Arc)

| Contract | Address |
|----------|---------|
| CCIPMessageRouter (app) | ${HUB_ROUTER} |
| Chainlink CCIP router (on-chain) | ${CCIP_ONCHAIN} |
| CollateralRegistry (proxy) | ${REGISTRY} |
| OracleConsumer (proxy) | ${ORACLE} |
| LendingPool (proxy) | ${POOL} |
| AuctionLiquidationManager (proxy) | ${LIQ} |
| HealthFactorEngine (proxy) | ${HF} |
| MockUSDC | ${USDC} |
| ChainlinkAutomationKeeper | ${KEEPER} |

_Proxy implementation addresses are stored in \`contracts/deployments/hub.json\`._

## Ethereum Sepolia (source)

| Contract | Address |
|----------|---------|
| CardFiCollectible | ${SEP_COLL} |
| NFTVault | ${SEP_VAULT} |
| CollateralAdapter_CardFiCollectible | ${SEPOLIA_ADAPTER} |

## Arbitrum Sepolia (source)

| Contract | Address |
|----------|---------|
| CardFiCollectible | ${ARB_COLL} |
| NFTVault | ${ARB_VAULT} |
| CollateralAdapter_CardFiCollectible | ${ARB_ADAPTER} |

## Application config

Use these in \`.env\` / \`frontend/.env\` when the hub is Arc:

\`\`\`env
VITE_HUB_NETWORK=arc
VITE_ARC_TESTNET_RPC_URL=${ARC_TESTNET_RPC}
VITE_LENDING_POOL_ADDRESS=${POOL}
VITE_COLLATERAL_REGISTRY_ADDRESS=${REGISTRY}
VITE_ORACLE_CONSUMER_ADDRESS=${ORACLE}
VITE_HEALTH_FACTOR_ENGINE_ADDRESS=${HF}
VITE_LIQUIDATION_MANAGER_ADDRESS=${LIQ}
VITE_USDC_ADDRESS=${USDC}
VITE_SEPOLIA_RPC_URL=${SEPOLIA_RPC}
VITE_COLLATERAL_ADAPTER_ADDRESS=${SEPOLIA_ADAPTER}
VITE_SLAB_FINANCE_COLLECTIBLE_ADDRESS=${SEP_COLL}
\`\`\`

For Arbitrum Sepolia as the **user-facing** source chain in the app, point adapter and collectible env vars at the Arbitrum Sepolia deployment (\`${ARB_ADAPTER}\`, \`${ARB_COLL}\`) or extend the frontend to support both chains.

**Indexer / backend** (\`.env.example\`): set \`INDEXER_*_ADDRESS\` and \`BACKEND_*_ADDRESS\` to the hub proxies above; source-chain indexer fields to Sepolia or Arbitrum Sepolia addresses as needed.

## Artifact files

- \`contracts/deployments/hub.json\`
- \`contracts/deployments/eth-sepolia.json\`
- \`contracts/deployments/arbitrum-sepolia.json\`

${STATIC_GUIDE}
EOF

echo "Wrote $DEPLOYMENTS_MD"
echo "Done."
