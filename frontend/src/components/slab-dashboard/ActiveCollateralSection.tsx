import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ConnectWalletPrompt } from "@/components/slab-dashboard/ConnectWalletPrompt";
import { SectionTitle } from "@/components/slab-dashboard/SectionTitle";
import { dashboardSurface } from "@/components/slab-dashboard/dashboardTokens";
import { useProtocolStats, useUserCollateral } from "@/hooks";
import { isApiConfigured } from "@/lib/api";
import { formatUsdFromSnapshotString, formatUsdNumber, price8ToUsdNumber } from "@/lib/hubFormat";
import { sepolia } from "@/lib/chains";

const guestPreviewNfts = [
  {
    img: "https://picsum.photos/seed/slabfi-guest-a/400/288",
    line: "Sample graded card",
    grade: "PSA 10",
    value: "Preview",
  },
  {
    img: "https://picsum.photos/seed/slabfi-guest-b/400/288",
    line: "Sample graded card",
    grade: "BGS 9.5",
    value: "Preview",
  },
  {
    img: "https://picsum.photos/seed/slabfi-guest-c/400/288",
    line: "Sample graded card",
    grade: "PSA 9",
    value: "Preview",
  },
] as const;

type ActiveCollateralSectionProps = {
  guest?: boolean;
};

export function ActiveCollateralSection({ guest = false }: ActiveCollateralSectionProps) {
  const { data: protocol } = useProtocolStats();
  const { data: items, isLoading } = useUserCollateral();

  const tvlHint =
    protocol?.latestSnapshot?.totalAssets != null
      ? `Protocol TVL $${formatUsdFromSnapshotString(protocol.latestSnapshot.totalAssets)}`
      : isApiConfigured()
        ? ""
        : "";

  if (guest) {
    return (
      <section>
        <SectionTitle title="Active Collateral Preview" />
        {tvlHint ? (
          <p className="mb-3 text-center text-xs text-on-surface-variant">{tvlHint}</p>
        ) : null}
        <div className="relative">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3 xl:gap-10">
            {guestPreviewNfts.map((nft) => (
              <div
                key={nft.line + nft.grade}
                className={`${dashboardSurface.nftCard} overflow-hidden transition-all hover:scale-[1.02]`}
              >
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-surface-container-high">
                  <img
                    src={nft.img}
                    alt=""
                    className="h-full w-full object-cover opacity-80 grayscale-[0.35]"
                  />
                </div>
                <div className="space-y-1 p-4 md:p-5">
                  <p className="text-xs font-bold uppercase text-secondary">{nft.line}</p>
                  <p className="font-headline text-base font-extrabold text-primary md:text-lg">{nft.grade}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-primary md:text-base">{nft.value}</span>
                    <span className="rounded bg-tertiary-container px-1.5 py-0.5 text-[10px] text-tertiary-fixed-dim">
                      Eligible
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-[4px]">
            <div className="mx-4 max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl ring-1 ring-zinc-200/60 md:p-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary">
                <Icon name="lock" className="!text-4xl" />
              </div>
              <h4 className="mb-2 font-headline text-2xl font-extrabold text-primary md:text-3xl">
                Private Portfolio
              </h4>
              <p className="mb-6 text-sm leading-relaxed text-on-surface-variant md:text-base">
                Connect your wallet to unlock your active collateral and see your LTV metrics in real-time.
              </p>
              <ConnectWalletPrompt size="md" className="w-full">
                Connect Wallet to View Assets
              </ConnectWalletPrompt>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle
        title="Active Collateral"
        action={
          <Link
            to="/assets?scope=mine"
            className="text-xs font-medium text-secondary hover:underline"
          >
            View all
          </Link>
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-48 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {(items ?? []).slice(0, 8).map((c) => {
            const title = c.cardName?.trim() || `Token #${c.tokenId}`;
            const img = c.cardImage?.trim();
            const usd = price8ToUsdNumber(c.latestPriceUsd ?? undefined);
            return (
              <div key={c.id} className={dashboardSurface.nftCard}>
                <div className="relative h-36">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-surface-container-high text-4xl">
                      🃏
                    </div>
                  )}
                  <div className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white backdrop-blur-md">
                    {sepolia.name}
                  </div>
                </div>
                <div className="border-t border-zinc-100 bg-zinc-50/80 p-3">
                  <p className="text-[8px] font-bold uppercase text-secondary">Indexed</p>
                  <h4 className="truncate text-xs font-bold text-on-surface">{title}</h4>
                  <p className="mt-0.5 font-headline text-xs font-extrabold text-primary">
                    {usd > 0 ? `$${formatUsdNumber(usd)}` : "—"}
                  </p>
                </div>
              </div>
            );
          })}
          <Link
            to="/lock"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white p-6 shadow-sm transition-all hover:border-secondary hover:shadow-md"
          >
            <Icon name="add_circle" className="mb-2 !text-3xl text-secondary" />
            <p className="text-center text-[10px] font-bold uppercase text-secondary">Add Asset</p>
          </Link>
        </div>
      )}
    </section>
  );
}
