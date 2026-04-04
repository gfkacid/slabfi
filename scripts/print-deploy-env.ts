/**
 * Emits bash `export` lines for forge deploy (RPCs, CCIP routers, selectors, CRE forwarder).
 * Single source of truth: shared/config/testnet.ts
 *
 * From repo root: `pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts`
 */
import { testnetConfig } from "../shared/config/testnet";

const h = testnetConfig.hub;
const s = testnetConfig.source;
const lines = [
  `export ARC_TESTNET_RPC=${JSON.stringify(h.rpcUrl)}`,
  `export SEPOLIA_RPC=${JSON.stringify(s.rpcUrl)}`,
  `export CCIP_ROUTER_ARC=${JSON.stringify(h.ccipRouter)}`,
  `export CCIP_ROUTER_SEPOLIA=${JSON.stringify(s.ccipRouter)}`,
  `export ARC_CHAIN_SELECTOR=${JSON.stringify(h.ccipChainSelector)}`,
  `export SEPOLIA_CHAIN_SELECTOR=${JSON.stringify(s.ccipChainSelector)}`,
  `export CRE_FORWARDER_ADDRESS=${JSON.stringify(testnetConfig.cre.forwarderAddress)}`,
  `export HUB_USDC_ADDRESS=${JSON.stringify(h.contracts.usdc)}`,
];
console.log(lines.join("\n"));
