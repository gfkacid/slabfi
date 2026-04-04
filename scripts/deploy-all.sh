#!/usr/bin/env bash
# Deploy CardFi hub on Arc Testnet, source stack on Ethereum Sepolia, register adapter, write DEPLOYMENTS.md.
# Chain RPCs and CCIP constants come from shared/config/testnet.ts (via scripts/print-deploy-env.ts).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS="$REPO_ROOT/contracts"
HUB_JSON="$CONTRACTS/deployments/hub.json"
SEPOLIA_JSON="$CONTRACTS/deployments/eth-sepolia.json"
DEPLOYMENTS_MD="$REPO_ROOT/DEPLOYMENTS.md"

if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

# Preserve RPC overrides from .env / environment; print-deploy-env.ts always emits defaults from testnet.ts.
_HUB_RPC_OVERRIDE="${ARC_TESTNET_RPC:-}"
_SOURCE_RPC_OVERRIDE="${SEPOLIA_RPC:-}"

eval "$(cd "$REPO_ROOT/indexer" && pnpm exec tsx ../scripts/print-deploy-env.ts)"

if [[ -n "$_HUB_RPC_OVERRIDE" ]]; then
  export ARC_TESTNET_RPC="$_HUB_RPC_OVERRIDE"
fi
if [[ -n "$_SOURCE_RPC_OVERRIDE" ]]; then
  export SEPOLIA_RPC="$_SOURCE_RPC_OVERRIDE"
fi
unset _HUB_RPC_OVERRIDE _SOURCE_RPC_OVERRIDE

if [[ -z "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  echo "Missing required env var: DEPLOYER_PRIVATE_KEY" >&2
  exit 1
fi

command -v forge >/dev/null 2>&1 || {
  echo "forge (Foundry) is not on PATH" >&2
  exit 1
}
command -v jq >/dev/null 2>&1 || {
  echo "jq is not on PATH" >&2
  exit 1
}

json_get() {
  local file="$1"
  local key="$2"
  jq -r --arg k "$key" '.[$k] // .hub[$k] // .source[$k] | if . == null then empty else tostring end' "$file"
}

mkdir -p "$CONTRACTS/deployments"
cd "$CONTRACTS"

export HUB_DEPLOYMENT_OUTPUT="deployments/hub.json"

if [[ "${ONLY_POST_DEPLOY:-}" != "1" ]]; then
  if [[ "${SKIP_HUB_DEPLOY:-}" == "1" ]]; then
    echo "=== Phase 1: Skipped (SKIP_HUB_DEPLOY=1); using existing $HUB_JSON ==="
  else
    echo "=== Phase 1: Deploy hub on Arc testnet ==="
    forge script script/Deploy_Hub.s.sol:DeployHub --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir -vvv
  fi

  HUB_ROUTER="$(json_get "$HUB_JSON" ccipMessageRouter)"
  REGISTRY="$(json_get "$HUB_JSON" collateralRegistry)"
  if [[ -z "$HUB_ROUTER" || -z "$REGISTRY" ]]; then
    echo "Failed to read hub addresses from $HUB_JSON" >&2
    exit 1
  fi

  export HUB_CCIP_ROUTER_ADDRESS="$HUB_ROUTER"
  export HUB_CHAIN_SELECTOR="$ARC_CHAIN_SELECTOR"

  echo "=== Phase 2: Deploy source chain on Ethereum Sepolia ==="
  export SOURCE_CCIP_ROUTER="$CCIP_ROUTER_SEPOLIA"
  export SOURCE_CHAIN_SELECTOR="$SEPOLIA_CHAIN_SELECTOR"
  export DEPLOYMENT_OUTPUT_FILE="deployments/eth-sepolia.json"
  export SOURCE_NETWORK_NAME="ethereum-sepolia"
  # Stub seed mints can exceed public-RPC per-tx gas caps; override with SOURCE_DEPLOY_TOKEN_LIMIT (see .env.example).
  export SOURCE_DEPLOY_TOKEN_LIMIT="${SOURCE_DEPLOY_TOKEN_LIMIT:-0}"
  forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$SEPOLIA_RPC" --broadcast --via-ir -vvv

  SEPOLIA_ADAPTER="$(json_get "$SEPOLIA_JSON" collateralAdapter)"
  if [[ -z "$SEPOLIA_ADAPTER" ]]; then
    echo "Failed to read adapter address from $SEPOLIA_JSON" >&2
    exit 1
  fi

  export COLLATERAL_REGISTRY_ADDRESS="$REGISTRY"
  export SEPOLIA_ADAPTER_ADDRESS="$SEPOLIA_ADAPTER"

  echo "=== Phase 3: Register Sepolia adapter on hub (Arc) ==="
  FORGE_P3=(
    forge script script/Configure_Hub_Adapters.s.sol:ConfigureHubAdapters
    --rpc-url "$ARC_TESTNET_RPC"
    --broadcast
    --via-ir
    -vvv
  )
  if [[ "${ARC_CONFIGURE_LEGACY:-}" == "1" ]]; then
    FORGE_P3+=(--legacy --with-gas-price "${ARC_CONFIGURE_GAS_PRICE:-120000000000}")
  elif [[ -n "${ARC_PRIORITY_GAS_PRICE:-}" ]]; then
    FORGE_P3+=(--priority-gas-price "$ARC_PRIORITY_GAS_PRICE")
  fi
  "${FORGE_P3[@]}"
else
  echo "=== ONLY_POST_DEPLOY=1: skipping forge (CRE + DEPLOYMENTS.md only) ==="
fi

TS="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

STATIC_GUIDE="$(cat <<'GUIDE_EOF'
## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`)
- `jq`, `pnpm`
- Node dependencies for CCIP contracts: from repo root run `pnpm install`
- Native currency on Arc and Ethereum Sepolia for gas (and LINK or native CCIP fees on Sepolia when locking NFTs)

## One-command deployment

RPC URLs and CCIP constants are read from [`shared/config/testnet.ts`](../shared/config/testnet.ts) via `scripts/print-deploy-env.ts`. Set `DEPLOYER_PRIVATE_KEY` in `.env`, then:

```bash
chmod +x scripts/deploy-all.sh
./scripts/deploy-all.sh
```

This runs: hub on Arc, source stack on Ethereum Sepolia, then hub configuration for the Sepolia adapter.

## Manual step-by-step

1. **Hub (Arc)** — writes `contracts/deployments/hub.json`:

   ```bash
   cd contracts
   # From repo root, export forge env from testnet config:
   eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
   export HUB_DEPLOYMENT_OUTPUT=deployments/hub.json
   forge script script/Deploy_Hub.s.sol:DeployHub --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir
   ```

2. **Set hub router** for source script:

   ```bash
   export HUB_CCIP_ROUTER_ADDRESS=<ccipMessageRouter from hub.json>
   export HUB_CHAIN_SELECTOR=$ARC_CHAIN_SELECTOR
   ```

3. **Ethereum Sepolia**:

   ```bash
   eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
   export SOURCE_CCIP_ROUTER=$CCIP_ROUTER_SEPOLIA
   export SOURCE_CHAIN_SELECTOR=$SEPOLIA_CHAIN_SELECTOR
   export DEPLOYMENT_OUTPUT_FILE=deployments/eth-sepolia.json
   export SOURCE_NETWORK_NAME=ethereum-sepolia
   forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$SEPOLIA_RPC" --broadcast --via-ir
   ```

4. **Register adapter on Arc**:

   ```bash
   export COLLATERAL_REGISTRY_ADDRESS=<collateralRegistry from hub.json>
   export SEPOLIA_ADAPTER_ADDRESS=<collateralAdapter from eth-sepolia.json>
   forge script script/Configure_Hub_Adapters.s.sol:ConfigureHubAdapters --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir
   ```

## After deploy

Copy addresses into [`shared/config/testnet.ts`](../shared/config/testnet.ts) under `hub.contracts` and `source.contracts` (and `source.contracts.nftVault` for the indexer).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DEPLOYER_PRIVATE_KEY` | EOA used on Arc and Sepolia (must hold gas on both) |
| `DEPLOY_CRE_WORKFLOW` | Set to `1` to run local `cre workflow simulate --broadcast` after hub + Sepolia, then `cast send` `setMockPrice` (needs `cre`, `cast`, reachable price API — default `http://127.0.0.1:3001/...`) |
| `FAIL_ON_CRE_FAILURE` | Set to `1` to exit non-zero if CRE simulate or on-chain price tx does not complete |
| `EXTERNAL_PRICE_API_URL` | Optional; overrides `apiUrl` in generated `cre/price-oracle/config.deploy.json` |
| `CRE_PRICE_TOKEN_ID` | Optional token id string for the CRE config (default: first entry in `config.json`) |

Forge RPCs, CCIP values, and default `CRE_FORWARDER_ADDRESS` come from `shared/config/testnet.ts` via `eval "$(... print-deploy-env.ts)"` after sourcing `.env` (exports from the script override same-named vars from `.env`).
GUIDE_EOF
)"

HUB_ROUTER="$(json_get "$HUB_JSON" ccipMessageRouter)"
REGISTRY="$(json_get "$HUB_JSON" collateralRegistry)"
SEPOLIA_ADAPTER="$(json_get "$SEPOLIA_JSON" collateralAdapter)"
if [[ -z "$HUB_ROUTER" || -z "$REGISTRY" || -z "$SEPOLIA_ADAPTER" ]]; then
  echo "Missing deployment addresses (ccipMessageRouter, collateralRegistry, or collateralAdapter in JSON)." >&2
  exit 1
fi

ORACLE="$(json_get "$HUB_JSON" oracleConsumer)"
POOL="$(json_get "$HUB_JSON" lendingPool)"
LIQ="$(json_get "$HUB_JSON" auctionLiquidationManager)"
HF="$(json_get "$HUB_JSON" healthFactorEngine)"
USDC="$(json_get "$HUB_JSON" usdc)"
[[ -z "$USDC" ]] && USDC="$(json_get "$HUB_JSON" mockUsdc)"
KEEPER="$(json_get "$HUB_JSON" chainlinkAutomationKeeper)"
CCIP_ONCHAIN="$(json_get "$HUB_JSON" ccipRouterOnChain)"

SEP_COLL="$(json_get "$SEPOLIA_JSON" cardFiCollectible)"
SEP_VAULT="$(json_get "$SEPOLIA_JSON" nftVault)"

CRE_DIR="$REPO_ROOT/cre/price-oracle"
CRE_COMPLETED=0
if [[ "${DEPLOY_CRE_WORKFLOW:-}" == "1" ]]; then
  if ! command -v cre >/dev/null 2>&1; then
    echo "CRE skipped: Chainlink CRE CLI not on PATH (install cre, then re-run with DEPLOY_CRE_WORKFLOW=1)."
  elif ! command -v cast >/dev/null 2>&1; then
    echo "CRE skipped: cast (Foundry) not on PATH — needed to submit setMockPrice after simulate."
  elif [[ -z "${ORACLE:-}" || -z "${SEP_COLL:-}" ]]; then
    echo "CRE skipped: missing oracleConsumer or collectible address from deployment JSON."
  else
    echo "=== Optional: CRE workflow simulate + on-chain price (DEPLOY_CRE_WORKFLOW=1) ==="
    if (cd "$CRE_DIR" && npm ci --omit=dev); then
      BASE_CFG="$CRE_DIR/config.json"
      SCHEDULE=$(jq -r '.schedule' "$BASE_CFG")
      TOKEN_ID="${CRE_PRICE_TOKEN_ID:-$(jq -r '.evms[0].tokenId // "1"' "$BASE_CFG")}"
      COLL_LOWER=$(printf '%s' "$SEP_COLL" | tr '[:upper:]' '[:lower:]')
      BACKEND_DEFAULT="http://127.0.0.1:3001/cards/${COLL_LOWER}/${TOKEN_ID}/price"
      API_URL="${EXTERNAL_PRICE_API_URL:-$BACKEND_DEFAULT}"
      API_KEY="${SLABFI_API_KEY:-$(jq -r '.apiKey // ""' "$BASE_CFG")}"
      jq -n \
        --arg schedule "$SCHEDULE" \
        --arg apiUrl "$API_URL" \
        --arg apiKey "$API_KEY" \
        --arg oracle "$ORACLE" \
        --arg collection "$SEP_COLL" \
        --arg tokenId "$TOKEN_ID" \
        '{
          schedule: $schedule,
          apiUrl: $apiUrl,
          apiKey: $apiKey,
          evms: [{
            oracleConsumerAddress: $oracle,
            chainSelectorName: "arc-testnet",
            gasLimit: "500000",
            collection: $collection,
            tokenId: $tokenId
          }]
        }' >"$CRE_DIR/config.deploy.json"
      set +e
      CRE_OUTPUT=$(cd "$CRE_DIR" && cre workflow simulate . --target arc-testnet-deploy --broadcast 2>&1)
      cre_status=$?
      set -e
      if [[ "$cre_status" -ne 0 ]]; then
        echo "$CRE_OUTPUT" >&2
        echo "WARN: cre workflow simulate exited $cre_status (is the backend reachable at the price URL?). Hub and source deploys finished successfully." >&2
        if [[ "${FAIL_ON_CRE_FAILURE:-}" == "1" ]]; then
          exit "$cre_status"
        fi
      else
        PRICE=$(echo "$CRE_OUTPUT" | sed -n 's/.*Consensus price (8 decimals): \([0-9]*\).*/\1/p' | tail -1)
        if [[ -z "$PRICE" ]]; then
          echo "$CRE_OUTPUT" >&2
          echo "WARN: CRE simulate succeeded but could not parse consensus price from output." >&2
          if [[ "${FAIL_ON_CRE_FAILURE:-}" == "1" ]]; then
            exit 1
          fi
        else
          echo "Submitting oracle price on-chain: collection=$SEP_COLL tokenId=$TOKEN_ID price=$PRICE"
          set +e
          cast send "$ORACLE" \
            "setMockPrice(address,uint256,uint256,uint8)" \
            "$SEP_COLL" "$TOKEN_ID" "$PRICE" 1 \
            --rpc-url "$ARC_TESTNET_RPC" \
            --private-key "$DEPLOYER_PRIVATE_KEY"
          cast_status=$?
          set -e
          if [[ "$cast_status" -ne 0 ]]; then
            echo "WARN: cast send setMockPrice exited $cast_status." >&2
            if [[ "${FAIL_ON_CRE_FAILURE:-}" == "1" ]]; then
              exit "$cast_status"
            fi
          else
            CRE_COMPLETED=1
          fi
        fi
      fi
    else
      echo "CRE skipped: npm ci failed in cre/price-oracle (install dependencies manually)."
    fi
  fi
  if [[ "${FAIL_ON_CRE_FAILURE:-}" == "1" ]] && [[ "$CRE_COMPLETED" -ne 1 ]]; then
    echo "CRE simulate / on-chain price step did not complete successfully (FAIL_ON_CRE_FAILURE=1)." >&2
    exit 1
  fi
fi

cat >"$DEPLOYMENTS_MD" <<EOF
# CardFi deployments

_Generated: ${TS}_ (re-run \`scripts/deploy-all.sh\` to refresh.)

## Networks

| Network | Config (shared/config/testnet.ts) |
|---------|-------------------------------------|
| Arc (hub) | \`hub.rpcUrl\`, \`hub.ccipRouter\`, \`hub.ccipChainSelector\` |
| Ethereum Sepolia (source) | \`source.rpcUrl\`, \`source.ccipRouter\`, \`source.ccipChainSelector\` |

| Network | Chain selector value |
|---------|------------------------|
| Arc | ${ARC_CHAIN_SELECTOR} |
| Ethereum Sepolia | ${SEPOLIA_CHAIN_SELECTOR} |

## Hub contracts (Arc)

| Contract | Address |
|----------|---------|
| CCIPMessageRouter (app) | ${HUB_ROUTER} |
| Chainlink CCIP router (on-chain) | ${CCIP_ONCHAIN} |
| CollateralRegistry (proxy) | ${REGISTRY} |
| OracleConsumer (proxy) | ${ORACLE} |
| CRE Keystone forwarder (Arc testnet; config) | ${CRE_FORWARDER_ADDRESS} |
| LendingPool (proxy) | ${POOL} |
| AuctionLiquidationManager (proxy) | ${LIQ} |
| HealthFactorEngine (proxy) | ${HF} |
| USDC (hub, ERC-20) | ${USDC} |
| ChainlinkAutomationKeeper | ${KEEPER} |

_Proxy implementation addresses are stored in \`contracts/deployments/hub.json\`._

## Ethereum Sepolia (source)

| Contract | Address |
|----------|---------|
| CardFiCollectible | ${SEP_COLL} |
| NFTVault | ${SEP_VAULT} |
| CollateralAdapter_CardFiCollectible | ${SEPOLIA_ADAPTER} |

## Application config

Paste these into \`shared/config/testnet.ts\` (\`hub.contracts\` / \`source.contracts\`):

\`\`\`ts
hub: {
  contracts: {
    lendingPool: "${POOL}",
    collateralRegistry: "${REGISTRY}",
    oracleConsumer: "${ORACLE}",
    healthFactorEngine: "${HF}",
    liquidationManager: "${LIQ}",
    usdc: "${USDC}",
  },
},
source: {
  contracts: {
    collateralAdapter: "${SEPOLIA_ADAPTER}",
    slabFinanceCollectible: "${SEP_COLL}",
    nftVault: "${SEP_VAULT}",
  },
},
\`\`\`

## Artifact files

- \`contracts/deployments/hub.json\`
- \`contracts/deployments/eth-sepolia.json\`

${STATIC_GUIDE}
EOF

echo "Wrote $DEPLOYMENTS_MD"
echo "Done."
