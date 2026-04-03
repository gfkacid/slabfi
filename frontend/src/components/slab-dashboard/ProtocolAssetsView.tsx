import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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

const CATALOG_ASSETS: ProtocolCatalogAssetCardProps[] = [
  {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD3gzgDKNNk0A00k6jG20gr1q4BQa8csg8PR5SkMBd0DV-_VqTAIwd_prVMcnyK5x6ZZUe7G0hRL8GGD_9kOtqaReQ7dNY_GFj57F9-KE_d6-MbhoJzyeq_orntVBWQKGq0m5uDZJHEHQFaXjYZp2hfD04081XmSLmnlMuBK8KYv1DcEEb5Q-d7lek5b9wRkV64Bazv0Klw6ndyhDbcTE6jVSry2mc5lq7BFBAiELzuxFVoaa6TuUWZ6EF5JhRPoOn9HZy3lee7QbE",
    imageAlt: "Oracle Knight trading card",
    assetId: "101",
    title: "Oracle Knight #101",
    subtitle: "Edition: First Strike • Grade: PSA 10",
    valuation: "$1,240.00",
    ltvPercent: 65,
    health: "healthy",
    isMine: true,
  },
  {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKYnEC9xVqYRX4g_NVZmkewaFJ7WU34Bf7pquP3cE644ejdqWRCX0AVQ49pQ3gtnPKXwm3cHXzr3iKffAtU3BmWczE0sJp6JGctAbSNp4VbNkJ-mrroVU9y7T0uAQk5vtU4LR2krI1gdSRpOdn2rVx7pIaPEJeat8XnQ94OLAm8pCWpHpU1LXsQ1Egnl7URrF7kywlI_0p2l1suq3oRq5MyX82Hp0OkLJdfPe1SqOJWc1qbET66jk67yv_C3yRbhK4b74p4jvIF5E",
    imageAlt: "Oracle Knight variant card",
    assetId: "102",
    title: "Oracle Knight #102",
    subtitle: "Edition: Mythic • Grade: PSA 9.5",
    valuation: "$890.50",
    ltvPercent: 42,
    health: "healthy",
    isMine: true,
  },
  {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYaZVP4XzUbsKtdh3MQNJQTlxr8m4yFKOuA_ADt9V-MGMcokQRZIYPVsYe-1CuuRkTFBuPSSn2UHDmKwgYRkEUdR5fMPD3SmFTv4QrBJ-3JuMP_33KbRYh74onPaBzGcD_YCRQ7o7PexS7866Ylzs93VGVTv08PRF6NalhgzmPuyYQUGlsvwdIyFG5RwTYtb8hohIAPwafohy0MRf3HLRanfJ47yPZhxOKjrwK1NiQgaaYw1PyFhBePvK3mvXe1yzDPcW_aU-wJ5s",
    imageAlt: "Oracle Knight frost variant",
    assetId: "103",
    title: "Oracle Knight #103",
    subtitle: "Edition: Rare • Grade: BGS 9",
    valuation: "$2,100.00",
    ltvPercent: 58,
    health: "healthy",
  },
  {
    imageUrl: "https://picsum.photos/seed/slabfi-solaris/600/800",
    imageAlt: "Solaris Dragon trading card",
    assetId: "442",
    title: "Solaris Dragon #442",
    subtitle: "Edition: Genesis • Grade: PSA 10",
    valuation: "$4,500.00",
    ltvPercent: 35,
    health: "healthy",
  },
  {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKYnEC9xVqYRX4g_NVZmkewaFJ7WU34Bf7pquP3cE644ejdqWRCX0AVQ49pQ3gtnPKXwm3cHXzr3iKffAtU3BmWczE0sJp6JGctAbSNp4VbNkJ-mrroVU9y7T0uAQk5vtU4LR2krI1gdSRpOdn2rVx7pIaPEJeat8XnQ94OLAm8pCWpHpU1LXsQ1Egnl7URrF7kywlI_0p2l1suq3oRq5MyX82Hp0OkLJdfPe1SqOJWc1qbET66jk67yv_C3yRbhK4b74p4jvIF5E",
    imageAlt: "Tidal Wraith trading card",
    assetId: "781",
    title: "Tidal Wraith #781",
    subtitle: "Edition: Torrent • Grade: BGS 8.5",
    valuation: "$610.25",
    ltvPercent: 72,
    health: "warning",
    isMine: true,
  },
];

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
  const scope: "all" | "mine" = searchParams.get("scope") === "mine" ? "mine" : "all";

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
    [searchParams, setSearchParams]
  );

  const visible =
    scope === "all" ? CATALOG_ASSETS : CATALOG_ASSETS.filter((a) => a.isMine);

  const handleWithdraw = useCallback((asset: (typeof CATALOG_ASSETS)[number]) => {
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
            Global Protocol Catalog / Q3
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {visible.map((asset) => (
          <ProtocolCatalogAssetCard
            key={asset.assetId}
            {...asset}
            onWithdraw={asset.isMine ? () => handleWithdraw(asset) : undefined}
          />
        ))}
      </div>
    </>
  );
}
