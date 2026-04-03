/** Shared Tailwind fragments — light cards use white fill on zinc-50 canvas. */

export const dashboardSurface = {
  statTile:
    "flex flex-col justify-between rounded-xl border border-zinc-200/60 bg-white p-6 shadow-slab transition-all hover:scale-[1.01]",
  panel:
    "rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm",
  panelTight: "rounded-2xl border border-zinc-200/60 bg-white p-2 shadow-sm",
  nftCard:
    "group overflow-hidden rounded-xl border border-zinc-200/50 bg-white shadow-sm transition-all hover:shadow-md",
  quickAction:
    "group flex w-full items-center justify-between rounded-xl border border-zinc-200/60 bg-white p-4 text-left shadow-sm transition-all hover:bg-secondary-fixed/40",
} as const;

export const dashboardType = {
  sectionTitle: "font-headline text-xl font-extrabold text-primary",
  labelCaps: "text-xs font-medium uppercase tracking-wider text-on-surface-variant",
  micro: "text-[10px] font-medium tracking-tight text-on-surface-variant/60",
} as const;
