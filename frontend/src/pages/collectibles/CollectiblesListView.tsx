import { cn } from "@/lib/utils";
import { BootstrapIcon, MaskedSvgIcon } from "@/components/ui/BootstrapIcon";

import hammerCourt from "@/assets/svgs/hammer-court.svg";

import type { CollectibleListRow, CollectibleStatus } from "@/pages/collectibles/collectiblesMock";

function StatusBar({ status, hf }: { status: CollectibleStatus; hf: string }) {
  const gradient =
    status === "Healthy"
      ? "bg-[linear-gradient(184deg,#00FF22_10%,#D8FFDD_87%)]"
      : status === "Warning"
        ? "bg-[linear-gradient(184deg,#FF7300_10%,#FFD0A4_87%)]"
        : "bg-[linear-gradient(184deg,#FF0000_10%,#FFA4A4_87%)]";
  const pct = status === "Healthy" ? 70 : status === "Warning" ? 36 : 16;

  return (
    <div className="w-[200px]">
      <div className="flex items-center gap-1 text-[16px]">
        <span className={cn("flex-1 bg-clip-text text-transparent", gradient)}>{status}</span>
        <span className="shrink-0 text-white/50">HF: {hf}</span>
      </div>
      <div className="mt-2 h-[6px] w-full rounded-[200px] bg-white/20">
        <div className={cn("relative h-[6px] rounded-[200px]", gradient)} style={{ width: `${pct}%` }}>
          <span className="-translate-y-1/2 absolute right-0 top-1/2 size-1 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

function CollectibleListItem({ row }: { row: CollectibleListRow }) {
  return (
    <div className="flex items-center gap-20 rounded-[15px] bg-white/10 px-3 py-3 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]">
      <div className="flex min-w-0 flex-1 items-center gap-[18px]">
        <div className="h-[91px] w-[64px] shrink-0 overflow-hidden rounded-[10px]">
          <img src={row.imageSrc} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="min-w-0 space-y-1.5">
            <div className="truncate text-[18px] text-white">{row.name}</div>
            <div className="bg-clip-text text-[14px] font-extrabold uppercase text-transparent bg-[linear-gradient(192deg,#00FF22_10%,#D8FFDD_87%)]">
              {row.grade}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[14px] text-white">
            <BootstrapIcon name="patch-check" className="size-[14px]" colorClassName="bg-white" />
            <span className="font-extralight">{row.collectionLabel}</span>
            <span className="h-4 w-px bg-white/20" />
            <img src={row.collectionIconSrc} alt="" className="size-4 object-contain" />
          </div>
        </div>
      </div>

      <div className="w-[200px] shrink-0 text-right">
        <div className="bg-clip-text text-[22px] font-extrabold uppercase text-transparent bg-[linear-gradient(184deg,#00FF22_10%,#D8FFDD_87%)]">
          {row.value}
        </div>
      </div>

      <div className="w-[200px] shrink-0">
        <StatusBar status={row.status} hf={row.hf} />
      </div>

      <div className="w-[118px] shrink-0">
        {row.action ? (
          <button
            type="button"
            className={cn(
              "h-10 w-full rounded-[8px] px-3 text-[16px] font-bold uppercase transition-[filter,background-color]",
              row.action.tone === "brand"
                ? "bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)] text-black hover:brightness-105"
                : "border border-zinc-400/70 text-zinc-400 hover:bg-white/5",
            )}
          >
            {row.action.tone === "brand" ? (
              <span className="inline-flex items-center justify-center gap-2">
                <MaskedSvgIcon url={hammerCourt} className="size-5" colorClassName="bg-black" />
                {row.action.label}
              </span>
            ) : (
              row.action.label
            )}
          </button>
        ) : (
          <div className="h-10 w-full opacity-0" />
        )}
      </div>
    </div>
  );
}

export function CollectiblesListView({ rows }: { rows: CollectibleListRow[] }) {
  return (
    <div>
      <div className="flex items-center gap-20 px-3 pr-6 text-[16px] font-extralight text-white">
        <div className="flex-1">Collectible</div>
        <div className="w-[200px] text-right">Value</div>
        <div className="w-[200px]">Status</div>
        <div className="w-[118px]">{` `}</div>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <CollectibleListItem key={`${row.name}-${row.value}`} row={row} />
        ))}
      </div>
    </div>
  );
}

