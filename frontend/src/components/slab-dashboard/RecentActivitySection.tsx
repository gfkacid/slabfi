import { Icon } from "@/components/ui/Icon";
import { SlabButton } from "@/components/slab-dashboard/SlabButton";
import { PanelCard } from "@/components/slab-dashboard/PanelCard";
import { SectionTitle } from "@/components/slab-dashboard/SectionTitle";
import { useActivityFeed } from "@/hooks";
import { formatRelativeTimeSecs } from "@/lib/hubFormat";
import { hubChain } from "@/lib/hub";
import type { ActivityFeedItem } from "@/lib/api";

type RecentActivitySectionProps = { guest?: boolean };

function titleForItem(item: ActivityFeedItem): string {
  const row = item.row;
  const kind = typeof row.kind === "string" ? row.kind : "Event";
  return kind.replace(/([A-Z])/g, " $1").trim() || "Activity";
}

function detailForItem(item: ActivityFeedItem): string {
  const row = item.row;
  const tx = typeof row.txHash === "string" ? row.txHash : "";
  if (tx.length > 12) return `${tx.slice(0, 8)}…${tx.slice(-4)}`;
  return item.source === "pool" ? "Lending pool" : "Protocol";
}

export function RecentActivitySection({ guest = false }: RecentActivitySectionProps) {
  const { data, isLoading, isError } = useActivityFeed(1, 12);

  if (guest) {
    return (
      <section>
        <SectionTitle title="Recent Activity" />
        <PanelCard variant="panel">
          <div className="flex flex-col items-center justify-center py-16 text-center md:py-20">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low">
              <Icon name="history" className="!text-3xl text-outline" />
            </div>
            <p className="mb-2 text-lg font-medium text-on-surface-variant">No activity found</p>
            <p className="max-w-xs text-sm text-on-surface-variant">
              Connect your wallet to see your recent protocol activity, loans, and yield harvests.
            </p>
          </div>
        </PanelCard>
      </section>
    );
  }

  const items = data?.items ?? [];

  return (
    <section>
      <SectionTitle title="Recent Activity" />
      <PanelCard variant="panelTight">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <div className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
            <div className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
          </div>
        ) : isError || items.length === 0 ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">
            {isError
              ? "Could not load activity. Check VITE_API_BASE and the backend."
              : "No recent activity for this wallet."}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {items.map((item, idx) => (
              <div
                key={`${item.source}-${item.timestampUnix}-${idx}`}
                className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-zinc-100"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      item.source === "pool"
                        ? "bg-secondary-fixed/30 text-secondary"
                        : "bg-tertiary-fixed/20 text-on-tertiary-container"
                    }`}
                  >
                    <Icon
                      name={item.source === "pool" ? "account_balance" : "sync"}
                      className="!text-xl"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{titleForItem(item)}</p>
                    <p className="text-[10px] text-on-surface-variant">{detailForItem(item)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-on-tertiary-container">{hubChain.name}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    {formatRelativeTimeSecs(item.timestampUnix)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-3 text-center">
          <SlabButton variant="textLink" type="button" disabled>
            View Transaction History
          </SlabButton>
        </div>
      </PanelCard>
    </section>
  );
}
