import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ConnectWalletPrompt } from "@/components/slab-dashboard/ConnectWalletPrompt";
import { SectionTitle } from "@/components/slab-dashboard/SectionTitle";
import { dashboardSurface } from "@/components/slab-dashboard/dashboardTokens";

const nfts = [
  { img: "https://picsum.photos/seed/slabfi-101/400/288", title: "Oracle Knight #101" },
  { img: "https://picsum.photos/seed/slabfi-102/400/288", title: "Oracle Knight #102" },
  { img: "https://picsum.photos/seed/slabfi-103/400/288", title: "Oracle Knight #103" },
] as const;

/** Preview imagery from Stitch “Dashboard (Logged Out)” screen. */
const guestPreviewNfts = [
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCM3P3xmzTC8Adf4rSgst30YynAR2uwGSt-hX-oB-O8R9QRpznqGs0GweuT-l7d4Qs6WQNkNiCQQ-6GuEDZuf5yzdM9lxrqWuKIRtrHtyRSeK2xhvgRchrPimjaPCi3tSQDLosxS778FNZnPvVN_FnD7t8AT1NUwjiqQoDmdzM-TKi_n1S0AsLvhZVhRiiMPa6pz2iAlZ8CmcNosVobnRdtHYJXbTONE0nTieDjDxqnip5DThQZTVbkTtEMxXwa2aY91VJVAB0fKAI",
    line: "Charizard Base Set",
    grade: "PSA 10 Gem Mint",
    value: "$320,000",
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBx5DuiqjpmWIv7dMERCW8VQyl7QSTMvv5O79ckv3du5WI57Jm1xbkwcorMwh1kaJxkqGocllnzrxkt2niGVMj2yd3NSlXH95TwLJxOSzde1Ve21_ZsHQIlf9x6BK1lWl9uY7PWpWLyUUIWD1RKo5ailcYxxJukGm19he_yG5dtzVaXQM1nDgBvQ0ShiOzLt5IsLPuxIbXpob3sn8aaAUs7SGrDQaGFfTnjLc4C4Jn-ABBgLx8B5dkcSHCC3glpOFYKxb4CQKqNKzY",
    line: "Mewtwo GX SV59",
    grade: "BGS 9.5 Mint",
    value: "$45,000",
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMK_XYD1j5JJeAm3X9Q7lbXhyPPna9_M9YP-foi2kt-t9NZzL7alHVz6uLpMPlqMVoDbzA_2We4sDCE769It0ksYDiVSoL2z3JXr-2zBXlChbyvpIV9278qjw4BV0l9T0NXk4xLkMZsR5ChStH8RWap36IlE91eY8Xicm-cWgPsYK5DvcoLsdD_IkQUcs9fSmfC8SH2mj8nk0WYBgWb2WmS5Ikpg4-vwLqiFaRhZ-uUvgOtO2JQVICjIrMWTRJKKCqP9mqLEL3r6o",
    line: "Illustrator Pikachu",
    grade: "PSA 9 Mint",
    value: "$5,250,000",
  },
] as const;

type ActiveCollateralSectionProps = {
  guest?: boolean;
};

export function ActiveCollateralSection({ guest = false }: ActiveCollateralSectionProps) {
  if (guest) {
    return (
      <section>
        <SectionTitle title="Active Collateral Preview" />
        <div className="relative">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3 xl:gap-10">
            {guestPreviewNfts.map((nft) => (
              <div
                key={nft.line}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {nfts.map((nft) => (
          <div key={nft.title} className={dashboardSurface.nftCard}>
            <div className="relative h-36">
              <img src={nft.img} alt="" className="h-full w-full object-cover" />
              <div className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white backdrop-blur-md">
                Sepolia
              </div>
            </div>
            <div className="border-t border-zinc-100 bg-zinc-50/80 p-3">
              <p className="text-[8px] font-bold uppercase text-secondary">CardFi</p>
              <h4 className="truncate text-xs font-bold text-on-surface">{nft.title}</h4>
              <p className="mt-0.5 font-headline text-xs font-extrabold text-primary">$150.00</p>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white p-6 shadow-sm transition-all hover:border-secondary hover:shadow-md"
        >
          <Icon name="add_circle" className="mb-2 !text-3xl text-secondary" />
          <p className="text-center text-[10px] font-bold uppercase text-secondary">Add Asset</p>
        </button>
      </div>
    </section>
  );
}
