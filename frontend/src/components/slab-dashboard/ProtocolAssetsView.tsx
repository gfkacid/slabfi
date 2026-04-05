import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { useModal } from "@/components/modal";
import { showToast } from "@/lib/toast";
import { ProtocolInsightsPanel } from "@/components/assets/ProtocolInsightsPanel";
import { CollateralTiersPanel } from "@/components/shared/lending/CollateralTiersPanel";
import { Icon } from "@/components/ui/Icon";
import { dashboardType } from "@/components/slab-dashboard/dashboardTokens";
import {
  ProtocolCatalogAssetCard,
  type ProtocolCatalogAssetCardProps,
} from "@/components/slab-dashboard/ProtocolCatalogAssetCard";
import { useCollateralCatalog, useUserCollateral } from "@/hooks";
import type { CollateralItemJson } from "@/lib/api";
import {
  collateralLatestUsdNumber,
  formatCardGradeDisplay,
  formatLtvPercentFromBps,
  formatUsdNumber,
} from "@/lib/hubFormat";

function itemToCardProps(
  c: CollateralItemJson,
  mine: boolean,
): ProtocolCatalogAssetCardProps {
  const usd = collateralLatestUsdNumber(c);
  const card = c.card;
  const title =
    (card?.cardName ?? c.cardName)?.trim() || `Token #${c.tokenId}`;
  const subtitle =
    card?.setName || card?.cardNumber
      ? [card.setName, card.cardNumber ? `#${card.cardNumber}` : null].filter(Boolean).join(" · ")
      : `${c.collection.slice(0, 8)}… · ${c.tokenId}`;
  const imageUrl =
    (card?.cardImage ?? c.cardImage)?.trim() ||
    `https://picsum.photos/seed/${encodeURIComponent(c.id)}/600/800`;

  let gradeLine: string | null = null;
  if (card?.gradeService != null && String(card.gradeService).trim() !== "") {
    const svc = String(card.gradeService).trim();
    if (card.grade != null) {
      gradeLine = `${svc} ${formatCardGradeDisplay(card.grade)}`;
    } else {
      gradeLine = svc;
    }
  }

  const ltvPct = formatLtvPercentFromBps(card?.ltvBps);
  const ltvPercentLabel = ltvPct ?? "—";

  return {
    imageUrl,
    imageAlt: title,
    assetId: String(c.tokenId),
    title,
    gradeLine,
    subtitle,
    valuation: usd > 0 ? `$${formatUsdNumber(usd)}` : "—",
    ltvPercentLabel,
    health: "healthy",
    isMine: mine,
  };
}

function SegmentToggle({
  value,
  onChange,
}: {
  value: "all" | "mine";
  onChange: (v: "all" | "mine") => void;
}) {
  const btn = (active: boolean) =>
    `rounded-lg px-4 py-2 font-headline text-xs font-bold transition-all ${
      active
        ? "bg-white text-primary shadow-sm"
        : "text-on-surface-variant hover:text-primary"
    }`;

  return (
    <div className="flex rounded-xl bg-surface-container-high p-1">
      <button type="button" className={btn(value === "all")} onClick={() => onChange("all")}>
        All Assets
      </button>
      <button type="button" className={btn(value === "mine")} onClick={() => onChange("mine")}>
        Show Mine
      </button>
    </div>
  );
}

export function ProtocolAssetsView() {
  const { openModal } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const { address } = useAccount();
  const scope: "all" | "mine" = searchParams.get("scope") === "mine" ? "mine" : "all";

  const { data: catalog, isLoading: catLoading } = useCollateralCatalog();
  const { data: mineList, isLoading: mineLoading } = useUserCollateral();

  const setScope = useCallback(
    (v: "all" | "mine") => {
      const next = new URLSearchParams(searchParams);
      if (v === "mine") {
        next.set("scope", "mine");
      } else {
        next.delete("scope");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const visible = useMemo(() => {
    if (scope === "mine") {
      const list = mineList ?? [];
      return list.map((c) => ({ key: c.id, props: itemToCardProps(c, true) }));
    }
    const list = catalog ?? [];
    const mineSet = new Set((mineList ?? []).map((x) => x.id.toLowerCase()));
    return list.map((c) => ({
      key: c.id,
      props: itemToCardProps(c, mineSet.has(c.id.toLowerCase())),
    }));
  }, [scope, catalog, mineList]);

  const loading = scope === "mine" ? mineLoading : catLoading;

  const handleWithdraw = useCallback((asset: ProtocolCatalogAssetCardProps) => {
    showToast({
      type: "success",
      title: "Withdrawal started",
      message: `${asset.title} (#${asset.assetId}): confirm the on-chain release in your wallet when prompted. If this NFT backs a loan, repay or close the position in Lending first.`,
    });
  }, []);

  return (
    <>
      <section className="mb-10" aria-label="Protocol overview">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">
          <ProtocolInsightsPanel />
          <CollateralTiersPanel />
        </div>
      </section>

      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className={`${dashboardType.labelCaps} mb-2 block tracking-widest`}>
            Global Protocol Catalog
          </span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
            Protocol Assets
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <SegmentToggle value={scope} onChange={setScope} />
          <button
            type="button"
            onClick={() => openModal("collateralDeposit")}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 font-headline text-xs font-bold text-white shadow-lg transition-all hover:opacity-95 active:scale-[0.98]"
          >
            <Icon name="add" className="!text-base text-white" />
            Deposit
          </button>
        </div>
      </header>

      {scope === "mine" && !address ? (
        <p className="text-sm text-on-surface-variant">Connect your wallet to see your collateral.</p>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="aspect-[3/4] animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No collateral in the indexer yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {visible.map(({ key, props: asset }) => (
            <ProtocolCatalogAssetCard
              key={key}
              {...asset}
              onWithdraw={asset.isMine ? () => handleWithdraw(asset) : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}
