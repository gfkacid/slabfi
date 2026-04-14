#!/usr/bin/env bash
# Solana hub (Anchor) + per-chain EVM deploy (`Deploy_EvmSourceLayerZero.s.sol`). See DOCS.md.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

echo "=== Slab deploy helper ==="
echo ""
(cd "$REPO_ROOT/indexer" && pnpm exec tsx ../scripts/print-deploy-env.ts)
echo ""
cat <<EOF
Solana hub:
  cd $REPO_ROOT/programs/slab_hub && anchor build && anchor deploy --provider.cluster mainnet-beta

EVM (repeat per chain; LZ_ENDPOINT from LayerZero chain docs):
  cd $REPO_ROOT/contracts
  forge script script/Deploy_EvmSourceLayerZero.s.sol:DeployEvmSourceLayerZero \\
    --rpc-url "\$POLYGON_RPC_URL" --broadcast --via-ir -vvv

Env: DEPLOYER_PRIVATE_KEY, LZ_ENDPOINT, LZ_DST_EID (30168), COLLECTION, SOURCE_CHAIN_ID,
DEPLOYMENT_OUTPUT_FILE (e.g. deployments/evm/polygon.json), NETWORK_KEY (polygon|base)

Courtyard on Polygon (example COLLECTION): 0x251be3a17af4892035c37ebf5890f4a4d889dcad — SOURCE_CHAIN_ID=137
Beezie on Base (example COLLECTION): 0xbb5ec6fd4b61723bd45c399840f1d868840ca16f — SOURCE_CHAIN_ID=8453

Then:
  pnpm --filter @slabfinance/indexer exec tsx ../scripts/sync-protocol-from-deployments.ts

Optional: whitelist synthetic collection PDAs on Solana (HUB_ADMIN_KEYPAIR in .env):
  pnpm whitelist:hub-evm
EOF
