/**
 * Writes addresses from `contracts/deployments/evm/{polygon,base}.json` into
 * `shared/config/protocol.ts` between @slabfi-sync markers.
 *
 *   pnpm --filter @slabfinance/indexer exec tsx ../scripts/sync-protocol-from-deployments.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");

const MARKERS: Record<string, readonly [string, string]> = {
  polygon: ["// @slabfi-sync:evm-polygon-contracts-begin", "// @slabfi-sync:evm-polygon-contracts-end"],
  base: ["// @slabfi-sync:evm-base-contracts-begin", "// @slabfi-sync:evm-base-contracts-end"],
};

type DeployJson = {
  collection?: string;
  nftVault?: string;
  collateralAdapterLayerZero?: string;
};

function loadJson(path: string): DeployJson | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as DeployJson;
}

function replaceBetween(
  content: string,
  beginMarker: string,
  endMarker: string,
  innerLines: string[],
): string {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `([ \\t]*${esc(beginMarker)}\\n)[\\s\\S]*?(\\n[ \\t]*${esc(endMarker)})`,
    "m",
  );
  const m = content.match(re);
  if (!m) {
    throw new Error(`Markers not found: ${beginMarker} … ${endMarker} in shared/config/protocol.ts`);
  }
  const indent = "        ";
  const body = innerLines.map((line) => `${indent}${line}`).join("\n");
  return content.replace(re, `$1${body}$2`);
}

function linesFromDeploy(d: DeployJson): string[] {
  const collection = (d.collection || "").trim();
  const vault = (d.nftVault || "").trim();
  const adapter = (d.collateralAdapterLayerZero || "").trim();
  return [
    `collection: "${collection}",`,
    `nftVault: "${vault}",`,
    `collateralAdapterLayerZero: "${adapter}",`,
  ];
}

function main() {
  const protocolPath = join(repoRoot, "shared/config/protocol.ts");
  let ts = readFileSync(protocolPath, "utf8");
  let updated = 0;

  for (const key of ["polygon", "base"] as const) {
    const path = join(repoRoot, `contracts/deployments/evm/${key}.json`);
    const data = loadJson(path);
    if (!data) {
      console.warn(`sync-protocol-from-deployments: skip (missing ${path})`);
      continue;
    }
    const [begin, end] = MARKERS[key]!;
    ts = replaceBetween(ts, begin, end, linesFromDeploy(data));
    updated++;
  }

  if (updated === 0) {
    console.warn("sync-protocol-from-deployments: no evm/*.json files found; protocol.ts unchanged.");
    return;
  }

  writeFileSync(protocolPath, ts, "utf8");
  console.log(`Updated shared/config/protocol.ts from ${updated} deployment file(s).`);
}

main();
