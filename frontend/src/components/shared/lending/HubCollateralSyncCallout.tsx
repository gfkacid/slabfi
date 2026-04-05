import { useMemo, type ReactNode } from "react";
import { useAccount, useBlock, useChainId, useReadContract } from "wagmi";
import { ORACLE_CONSUMER_ABI } from "@slabfinance/shared";
import {
  useHubPendingCollateralIds,
  useSyncHubCollateralForBorrow,
  useUserCollateral,
  type HubPendingCollateralDetail,
} from "@/hooks";
import { Button } from "@/components/ui/Button";
import { hubChain, hubContracts } from "@/lib/hub";
import { collateralLatestUsdNumber } from "@/lib/hubFormat";

/** Must match `OracleConsumer.PRICE_FRESHNESS_WINDOW` (26 hours). */
const ORACLE_FRESHNESS_SEC = 26n * 3600n;

type PriceSlot = {
  priceUSD: bigint;
  attestedAt: bigint;
  updatedAt: bigint;
  tier: number;
};

function normalizePriceSlot(raw: unknown): PriceSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if ("priceUSD" in o && "updatedAt" in o) {
    return {
      priceUSD: o.priceUSD as bigint,
      attestedAt: o.attestedAt as bigint,
      updatedAt: o.updatedAt as bigint,
      tier: Number(o.tier ?? 0),
    };
  }
  if (Array.isArray(raw) && raw.length >= 4) {
    return {
      priceUSD: raw[0] as bigint,
      attestedAt: raw[1] as bigint,
      updatedAt: raw[2] as bigint,
      tier: Number(raw[3]),
    };
  }
  return null;
}

function CatalogVersusOracleHint({
  collection,
  tokenId,
}: {
  collection: string;
  tokenId: bigint;
}) {
  const { data: rows } = useUserCollateral();
  const catalogUsd = useMemo(() => {
    if (!rows) return null;
    const match = rows.find(
      (r) =>
        r.collection.toLowerCase() === collection.toLowerCase() && BigInt(r.tokenId) === tokenId,
    );
    if (!match) return null;
    const n = collateralLatestUsdNumber(match);
    return n > 0 ? n : null;
  }, [rows, collection, tokenId]);

  if (catalogUsd == null) return null;
  return (
    <p className="mt-3 text-xs leading-relaxed text-amber-950/90">
      Assets can show <strong>${catalogUsd.toFixed(2)}</strong> from <strong>catalog / indexer</strong> data. Borrowing
      only reads <strong>OracleConsumer</strong> on Arc. If that contract has no fresh price for this NFT,{" "}
      <strong>Sync</strong> cannot activate collateral.
    </p>
  );
}

function PendingOracleDiagnostics({
  detail,
  borrowerAddress,
}: {
  detail: HubPendingCollateralDetail;
  borrowerAddress: string;
}) {
  const chainId = useChainId();
  const oracle =
    chainId === hubChain.id && hubContracts.oracleConsumer ? hubContracts.oracleConsumer : undefined;

  const { data: slotRaw, isFetched: slotFetched } = useReadContract({
    address: oracle,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "prices",
    args: [detail.collection, detail.tokenId],
    query: { enabled: Boolean(oracle) },
  });

  const slot = useMemo(() => normalizePriceSlot(slotRaw), [slotRaw]);
  const hasSlot = Boolean(slot && slot.updatedAt > 0n);

  const { isError: priceReverts, isFetched: priceFetched } = useReadContract({
    address: oracle,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "getPrice",
    args: [detail.collection, detail.tokenId],
    query: {
      enabled: Boolean(oracle && hasSlot),
      retry: false,
    },
  });

  const { data: block } = useBlock({
    chainId: hubChain.id,
    blockTag: "latest",
    query: { enabled: Boolean(oracle) },
  });

  if (!oracle) return null;

  const now = block?.timestamp ?? 0n;
  const stale =
    hasSlot && slot !== null && now > 0n && now > slot.attestedAt + ORACLE_FRESHNESS_SEC;
  const oracleReady = hasSlot && !stale && !priceReverts && priceFetched;

  const scriptHint = `From repo root (wallet must be OracleConsumer DEFAULT_ADMIN — use deployer key):

API_BASE=https://your-api \\
DEPLOYER_PRIVATE_KEY=0x… \\
pnpm oracle:push-mock -- ${borrowerAddress}

Or: pnpm oracle:reseed-pending  (uses DB + on-chain PENDING check; needs DEPLOYER_PRIVATE_KEY)

Or without API: PRICE_USD_8DEC=7670000000 ORACLE_TIER=2 DEPLOYER_PRIVATE_KEY=0x… pnpm oracle:push-mock -- ${borrowerAddress}`;

  let body: ReactNode;
  if (!slotFetched) {
    body = <p>Checking on-chain oracle…</p>;
  } else if (!hasSlot) {
    body = (
      <>
        <p>
          <strong>No price row</strong> in OracleConsumer for this NFT. Chainlink CRE must deliver{" "}
          <code className="rounded bg-black/5 px-1">onReport</code>, or on testnet an admin can call{" "}
          <code className="rounded bg-black/5 px-1">setMockPrice</code> (updates only OracleConsumer — no registry
          redeploy).
        </p>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/[0.04] p-2 text-[10px]">
          {scriptHint}
        </pre>
      </>
    );
  } else if (!priceFetched) {
    body = <p>Checking whether the stored price is still fresh…</p>;
  } else if (stale) {
    body = (
      <p>
        A price exists but it is <strong>stale</strong> (outside the 26h attestation window). Refresh via CRE or{" "}
        <code className="rounded bg-black/5 px-1">setMockPrice</code>, then use <strong>Sync</strong> again.
      </p>
    );
  } else if (oracleReady) {
    body = (
      <p>
        Oracle <code className="rounded bg-black/5 px-1">getPrice</code> succeeds. Try <strong>Sync position</strong>{" "}
        again, then refresh. If collateral stays Pending, verify the transaction on the explorer.
      </p>
    );
  } else {
    body = (
      <p>
        Oracle storage has a row but <code className="rounded bg-black/5 px-1">getPrice</code> still reverts. Check Arc
        RPC and the OracleConsumer contract for this collection and token id.
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-amber-200/60 pt-3 text-xs leading-relaxed text-amber-950/90">
      <p className="mb-1 font-semibold text-amber-950">Hub oracle check</p>
      <p className="mb-2 font-mono text-[11px] break-all opacity-90">
        collection {detail.collection} · token #{String(detail.tokenId)}
      </p>
      {body}
      <CatalogVersusOracleHint collection={detail.collection} tokenId={detail.tokenId} />
    </div>
  );
}

/** Shown when hub collateral is still `Pending`: activation needs OracleConsumer, not just indexer/catalog. */
export function HubCollateralSyncCallout({ className = "" }: { className?: string }) {
  const { chainId, address } = useAccount();
  const { hasPendingCollateral, firstPendingDetail, isLoading } = useHubPendingCollateralIds();
  const { sync, isPending } = useSyncHubCollateralForBorrow();

  if (chainId !== hubChain.id) return null;
  if (isLoading || !hasPendingCollateral) return null;

  return (
    <div
      className={`rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-950 ${className}`.trim()}
    >
      <p className="mb-3 text-sm">
        Your NFT is still <span className="font-semibold">Pending</span> on the registry.{" "}
        <strong>Sync position</strong> only works after <code className="rounded bg-black/5 px-1 text-xs">OracleConsumer</code>{" "}
        returns a <span className="font-semibold">fresh</span> price for that Sepolia collection address and token id.
      </p>
      <Button type="button" onClick={() => void sync()} disabled={isPending}>
        {isPending ? "Syncing…" : "Sync position on hub"}
      </Button>
      {firstPendingDetail && address ? (
        <PendingOracleDiagnostics detail={firstPendingDetail} borrowerAddress={address} />
      ) : null}
    </div>
  );
}
