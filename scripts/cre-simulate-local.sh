#!/usr/bin/env bash
# Local CRE simulation for the Slab.Finance price oracle workflow (cron → HTTP → consensus → writeReport).
# Uses Chainlink CRE CLI + @chainlink/cre-sdk (see cre/price-oracle/main.ts).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRE_DIR="${CRE_WORKFLOW_DIR:-$ROOT/cre/price-oracle}"

# Bun install script adds ~/.bun/bin to shell rc; prepend here so `pnpm cre:simulate` works in fresh terminals.
if [[ -x "${HOME}/.bun/bin/bun" ]]; then
  export PATH="${HOME}/.bun/bin:${PATH}"
fi

die() {
  echo "cre-simulate-local: $*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing '$1' in PATH — $2"
}

need_cmd cre "install CRE CLI: https://docs.chain.link/cre/getting-started/cli-installation"
need_cmd bun "install Bun 1.2.21+ (CRE compiles TypeScript with it): https://bun.com/docs/installation"
need_cmd python3 "install Python 3 (used to merge CRE config and optional mock price HTTP server)"

[[ -d "$CRE_DIR" ]] || die "workflow directory not found: $CRE_DIR"

cd "$CRE_DIR"

# CRE CLI only reads CRE_ETH_PRIVATE_KEY for EVM signing (simulate broadcast, deploy, etc.).
# Repo convention is DEPLOYER_PRIVATE_KEY — reuse it when CRE's var is missing or invalid.
is_valid_hex_privkey() {
  local s="${1:-}"
  s="${s#0x}"
  [[ ${#s} -eq 64 ]] && [[ "$s" =~ ^[0-9a-fA-F]+$ ]]
}

read_env_file_value() {
  # args: file var_name
  local f="$1" var="$2" line val
  [[ -f "$f" ]] || return 1
  line="$(grep -m1 -E "^[[:space:]]*(export[[:space:]]+)?${var}=" "$f")" || return 1
  val="${line#*=}"
  val="${val%$'\r'}"
  val="${val#\"}"
  val="${val%\"}"
  val="${val#\'}"
  val="${val%\'}"
  [[ -n "$val" ]] || return 1
  printf '%s' "$val"
}

wire_cre_eth_private_key() {
  if is_valid_hex_privkey "${CRE_ETH_PRIVATE_KEY:-}"; then
    return 0
  fi
  unset CRE_ETH_PRIVATE_KEY 2>/dev/null || true
  local deployer="${DEPLOYER_PRIVATE_KEY:-}"
  if ! is_valid_hex_privkey "$deployer"; then
    deployer="$(read_env_file_value "$ROOT/.env" DEPLOYER_PRIVATE_KEY 2>/dev/null)" || true
  fi
  if is_valid_hex_privkey "$deployer"; then
    export CRE_ETH_PRIVATE_KEY="$deployer"
    echo "cre-simulate-local: set CRE_ETH_PRIVATE_KEY from DEPLOYER_PRIVATE_KEY (same EOA as forge/scripts)."
  fi
}
wire_cre_eth_private_key

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies in $CRE_DIR ..."
  if command -v npm >/dev/null 2>&1; then
    npm ci
  else
    bun install
  fi
fi

BROADCAST_FLAG=(--broadcast)
if [[ "${CRE_SIMULATE_NO_BROADCAST:-}" == "1" ]]; then
  BROADCAST_FLAG=()
  echo "CRE_SIMULATE_NO_BROADCAST=1 — simulating without on-chain broadcast."
fi

BASE_CONFIG="${CRE_ORACLE_CONFIG:-$CRE_DIR/config.json}"
[[ -f "$BASE_CONFIG" ]] || die "config file not found: $BASE_CONFIG"

EFFECTIVE_CONFIG="$(mktemp "${TMPDIR:-/tmp}/cre-oracle-config.XXXXXX.json")"
MOCK_PID=""

cleanup() {
  if [[ -n "${MOCK_PID:-}" ]]; then
    kill "$MOCK_PID" 2>/dev/null || true
    wait "$MOCK_PID" 2>/dev/null || true
  fi
  rm -f "$EFFECTIVE_CONFIG" 2>/dev/null || true
}
trap cleanup EXIT

# Backend GET /cards/.../price uses ApiKeyGuard → x-api-key must match SLABFI_API_KEY.
resolve_slabfi_api_key() {
  local k="${SLABFI_API_KEY:-}"
  k="${k//$'\r'/}"
  k="${k#"${k%%[![:space:]]*}"}"
  k="${k%"${k##*[![:space:]]}"}"
  if [[ -z "$k" ]]; then
    k="$(read_env_file_value "$ROOT/.env" SLABFI_API_KEY 2>/dev/null)" || true
  fi
  printf '%s' "$k"
}

SLAB_KEY="$(resolve_slabfi_api_key)"
# Default: local mock HTTP so `pnpm cre:simulate` succeeds without backend + seeded cards.
# Use real Nest /cards/.../price with: CRE_SIMULATE_USE_BACKEND=1 (needs SLABFI_API_KEY + running API).
USE_MOCK=1
if [[ "${CRE_SIMULATE_USE_BACKEND:-}" == "1" ]]; then
  USE_MOCK=0
elif [[ "${CRE_SIMULATE_USE_MOCK:-}" == "1" ]]; then
  USE_MOCK=1
fi

if [[ "$USE_MOCK" == "1" ]]; then
  if [[ "${CRE_SIMULATE_REQUIRE_BACKEND:-}" == "1" ]]; then
    die "CRE_SIMULATE_REQUIRE_BACKEND=1 conflicts with mock HTTP — unset it or set CRE_SIMULATE_USE_BACKEND=1 with SLABFI_API_KEY and a running backend."
  fi
  MOCK_PORT="$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')"
  python3 -c "
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
port = int(sys.argv[1])
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{\"priceUsd\":\"10000000\"}')
    def log_message(self, *args):
        pass
HTTPServer(('127.0.0.1', port), H).serve_forever()
" "$MOCK_PORT" &
  MOCK_PID=$!
  sleep 0.25
  MOCK_URL="http://127.0.0.1:${MOCK_PORT}/cre-mock-price"
  echo "cre-simulate-local: mock HTTP ${MOCK_URL} (priceUsd=10000000). For Nest backend + SLABFI_API_KEY use CRE_SIMULATE_USE_BACKEND=1."
  SLABFI_MERGE_KEY="" CRE_MOCK_URL="$MOCK_URL" python3 -c "
import json, os, sys
base, out = sys.argv[1], sys.argv[2]
mock = os.environ.get('CRE_MOCK_URL', '').strip()
with open(base) as f:
    j = json.load(f)
j['apiUrl'] = mock
j['apiKey'] = ''
with open(out, 'w') as f:
    json.dump(j, f)
" "$BASE_CONFIG" "$EFFECTIVE_CONFIG"
else
  [[ -n "$SLAB_KEY" ]] || die "CRE_SIMULATE_USE_BACKEND=1 requires SLABFI_API_KEY in env or repo-root .env (Nest ApiKeyGuard on GET /cards/.../price)."
  SLABFI_MERGE_KEY="$SLAB_KEY" CRE_MOCK_URL="" python3 -c "
import json, os, sys
base, out = sys.argv[1], sys.argv[2]
key = os.environ.get('SLABFI_MERGE_KEY', '').strip()
with open(base) as f:
    j = json.load(f)
cur = str(j.get('apiKey', '') or '').strip()
if key and not cur:
    j['apiKey'] = key
with open(out, 'w') as f:
    json.dump(j, f)
" "$BASE_CONFIG" "$EFFECTIVE_CONFIG"
  echo "cre-simulate-local: CRE_SIMULATE_USE_BACKEND=1 — using config apiUrl with x-api-key from SLABFI_API_KEY."
fi

CONFIG_ARGS=(--config "$EFFECTIVE_CONFIG")

ENV_ARGS=()
if [[ -n "${CRE_ENV_FILE:-}" ]]; then
  [[ -f "$CRE_ENV_FILE" ]] || die "CRE_ENV_FILE is not a file: $CRE_ENV_FILE"
  ENV_ARGS=(-e "$CRE_ENV_FILE")
fi

[[ "${CRE_SIMULATE_VERBOSE:-}" == "1" ]] && set -x
cre "${ENV_ARGS[@]}" workflow simulate . \
  --target local-simulation \
  "${BROADCAST_FLAG[@]}" \
  --non-interactive \
  --trigger-index 0 \
  "${CONFIG_ARGS[@]}" \
  "$@"
