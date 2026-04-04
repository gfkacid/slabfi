/**
 * Writes hub/source contract addresses from Foundry deployment JSON into
 * shared/config/testnet.ts between @slabfi-sync markers.
 *
 * From repo root (or indexer with cwd that has ../scripts):
 *   pnpm --filter @slabfinance/indexer exec tsx ../scripts/sync-testnet-from-deployments.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");

const HUB_BEGIN = "// @slabfi-sync:hub-contracts-begin";
const HUB_END = "// @slabfi-sync:hub-contracts-end";
const SRC_BEGIN = "// @slabfi-sync:source-contracts-begin";
const SRC_END = "// @slabfi-sync:source-contracts-end";

function getStr(obj: Record<string, unknown>, key: string): string | undefined {
  const nested = (k: string) => {
    const hub = obj.hub as Record<string, unknown> | undefined;
    const src = obj.source as Record<string, unknown> | undefined;
    return (obj[k] ?? hub?.[k] ?? src?.[k]) as string | undefined;
  };
  const v = nested(key);
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function loadJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) {
    console.error(`sync-testnet-from-deployments: missing ${path} (run contract deploy first).`);
    process.exit(1);
  }
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
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
    throw new Error(
      `Markers not found: ${beginMarker} … ${endMarker} in shared/config/testnet.ts`,
    );
  }
  const indent = "      ";
  const body = innerLines.map((line) => `${indent}${line}`).join("\n");
  return content.replace(re, `$1${body}$2`);
}

function main() {
  const hubPath = join(repoRoot, "contracts/deployments/hub.json");
  const sepPath = join(repoRoot, "contracts/deployments/eth-sepolia.json");
  const testnetPath = join(repoRoot, "shared/config/testnet.ts");

  const hub = loadJson(hubPath);
  const sep = loadJson(sepPath);

  const lendingPool = getStr(hub, "lendingPool");
  const collateralRegistry = getStr(hub, "collateralRegistry");
  const oracleConsumer = getStr(hub, "oracleConsumer");
  const healthFactorEngine = getStr(hub, "healthFactorEngine");
  const liquidationManager =
    getStr(hub, "auctionLiquidationManager") ?? getStr(hub, "liquidationManager");
  const hubUsdc = getStr(hub, "usdc") ?? getStr(hub, "mockUsdc");

  const collateralAdapter = getStr(sep, "collateralAdapter");
  const collectible =
    getStr(sep, "cardFiCollectible") ?? getStr(sep, "slabFinanceCollectible");
  const nftVault = getStr(sep, "nftVault");

  const requiredHub: [string, string | undefined][] = [
    ["lendingPool", lendingPool],
    ["collateralRegistry", collateralRegistry],
    ["oracleConsumer", oracleConsumer],
    ["healthFactorEngine", healthFactorEngine],
    ["liquidationManager", liquidationManager],
    ["usdc", hubUsdc],
  ];
  const missingHub = requiredHub.filter(([, v]) => !v).map(([k]) => k);
  const missingSep = [
    !collateralAdapter && "collateralAdapter",
    !collectible && "cardFiCollectible",
    !nftVault && "nftVault",
  ].filter(Boolean) as string[];

  if (missingHub.length || missingSep.length) {
    console.error("sync-testnet-from-deployments: missing addresses in deployment JSON:");
    if (missingHub.length) console.error("  hub.json:", missingHub.join(", "));
    if (missingSep.length) console.error("  eth-sepolia.json:", missingSep.join(", "));
    process.exit(1);
  }

  let ts = readFileSync(testnetPath, "utf8");

  const hubLines = [
    `lendingPool: "${lendingPool}",`,
    `collateralRegistry: "${collateralRegistry}",`,
    `oracleConsumer: "${oracleConsumer}",`,
    `healthFactorEngine: "${healthFactorEngine}",`,
    `liquidationManager: "${liquidationManager}",`,
    `usdc: "${hubUsdc}",`,
  ];
  const srcLines = [
    `collateralAdapter: "${collateralAdapter}",`,
    `slabFinanceCollectible: "${collectible}",`,
    `nftVault: "${nftVault}",`,
  ];

  ts = replaceBetween(ts, HUB_BEGIN, HUB_END, hubLines);
  ts = replaceBetween(ts, SRC_BEGIN, SRC_END, srcLines);

  writeFileSync(testnetPath, ts, "utf8");
  console.log("Updated shared/config/testnet.ts from deployment JSON.");
}

main();
