#!/usr/bin/env bash
# Full setup from SETUP.md: install, DB, deploy-all + CRE, sync testnet.ts, optional card seed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f "$REPO_ROOT/.env" ]]; then
  echo "Missing $REPO_ROOT/.env" >&2
  echo "Create it from the example: cp .env.example .env" >&2
  exit 1
fi

if [[ ! -f "$REPO_ROOT/frontend/.env" ]]; then
  cp "$REPO_ROOT/.env" "$REPO_ROOT/frontend/.env"
  echo "Created frontend/.env from root .env"
fi

set -a
# shellcheck disable=SC1091
source "$REPO_ROOT/.env"
set +a

missing_tools=()
for cmd in node pnpm forge cast jq cre npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    missing_tools+=("$cmd")
  fi
done

missing_env=()
[[ -z "${DEPLOYER_PRIVATE_KEY:-}" ]] && missing_env+=("DEPLOYER_PRIVATE_KEY")
[[ -z "${VITE_WALLETCONNECT_PROJECT_ID:-}" ]] && missing_env+=("VITE_WALLETCONNECT_PROJECT_ID")
[[ -z "${SLABFI_API_KEY:-}" ]] && missing_env+=("SLABFI_API_KEY")

if [[ -z "${DATABASE_URL:-}" ]]; then
  missing_env+=("DATABASE_URL")
elif [[ ! "${DATABASE_URL}" =~ ^mysql(2)?:// ]]; then
  missing_env+=("DATABASE_URL (must start with mysql:// or mysql2://)")
fi

missing_paths=()
[[ ! -f "$REPO_ROOT/shared/config/testnet.ts" ]] && missing_paths+=("shared/config/testnet.ts")

if [[ ${#missing_tools[@]} -gt 0 || ${#missing_env[@]} -gt 0 || ${#missing_paths[@]} -gt 0 ]]; then
  echo "Setup preflight failed. Fix the following, then re-run." >&2
  if [[ ${#missing_tools[@]} -gt 0 ]]; then
    echo "  Missing commands on PATH: ${missing_tools[*]}" >&2
  fi
  if [[ ${#missing_env[@]} -gt 0 ]]; then
    echo "  Missing or invalid environment variables: ${missing_env[*]}" >&2
  fi
  if [[ ${#missing_paths[@]} -gt 0 ]]; then
    echo "  Missing files: ${missing_paths[*]}" >&2
  fi
  echo "" >&2
  echo "Hints:" >&2
  for t in "${missing_tools[@]}"; do
    case "$t" in
      jq) echo "  jq — Debian/Ubuntu: sudo apt install jq  ·  macOS: brew install jq  ·  https://jqlang.org/download/" >&2 ;;
      cre)
        echo "  cre — Chainlink CRE CLI: https://docs.chain.link/cre/reference/cli/installation" >&2
        ;;
      *) ;;
    esac
  done
  for e in "${missing_env[@]}"; do
    case "$e" in
      SLABFI_API_KEY)
        echo "  SLABFI_API_KEY — add to .env (any secret string; backend uses it for GET /cards/.../price and CRE config.deploy.json)" >&2
        ;;
      *) ;;
    esac
  done
  exit 1
fi

echo "=== pnpm install ==="
pnpm install

echo "=== Prisma generate + db push ==="
pnpm db:generate
pnpm db:push

echo "=== Contract deploy + CRE simulate (best-effort; backend must be up for price HTTP) ==="
export DEPLOY_CRE_WORKFLOW=1
bash "$REPO_ROOT/scripts/deploy-all.sh"

echo "=== Sync shared/config/testnet.ts from deployments ==="
(cd "$REPO_ROOT/indexer" && pnpm exec tsx ../scripts/sync-testnet-from-deployments.ts)

if [[ -n "${SEED_CARD_COLLECTION:-}" ]]; then
  if [[ "${SEED_CARD_COLLECTION}" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
    echo "=== Seed card catalog (SEED_CARD_COLLECTION set) ==="
    pnpm db:seed:cards
  else
    echo "WARN: SEED_CARD_COLLECTION is set but is not a valid 0x address; skipping pnpm db:seed:cards." >&2
  fi
fi

cat <<'EOF'

Setup finished.

Do next (manual):
  • Fund the hub CCIP router with native USDC on Arc (see DOCS.md — fund CCIP router).
  • Set an oracle price: CRE workflow and/or setMockPrice on OracleConsumer (see SETUP.md §6).
  • Run the app: pnpm dev (or pnpm dev:frontend, pnpm dev:backend, pnpm dev:indexer).
  • Verify contracts: SETUP.md §9; API docs at http://localhost:3001/api when the backend is up.

If you change shared/config/testnet.ts, rebuild consumers: pnpm build:shared
EOF
