/**
 * Emits bash `export` lines for deploy tooling (Solana hub + Polygon/Base + LayerZero).
 */
import { protocolConfig } from "../shared/config/protocol";

const h = protocolConfig.hub;
const lz = protocolConfig.layerzero;

const lines = [
  `export SOLANA_RPC_URL=${JSON.stringify(h.rpcUrl)}`,
  `export SLAB_HUB_PROGRAM_ID=${JSON.stringify(h.programs.slabHub)}`,
  `export HUB_USDC_MINT=${JSON.stringify(h.usdcMint)}`,
  `export LZ_SOLANA_DST_EID=${JSON.stringify(lz.solanaDstEid)}`,
];

for (const src of Object.values(protocolConfig.evmSources)) {
  const id = src.id.toUpperCase();
  lines.push(`export ${id}_CHAIN_ID=${JSON.stringify(String(src.chainId))}`);
  lines.push(`export ${id}_RPC_URL=${JSON.stringify(src.rpcUrl)}`);
  lines.push(`export ${id}_LZ_ENDPOINT_ID=${JSON.stringify(String(src.lzEndpointId))}`);
}

console.log(lines.join("\n"));
