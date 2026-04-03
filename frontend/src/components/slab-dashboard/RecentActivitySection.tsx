import { Icon } from "@/components/ui/Icon";
import { SlabButton } from "@/components/slab-dashboard/SlabButton";
import { PanelCard } from "@/components/slab-dashboard/PanelCard";
import { SectionTitle } from "@/components/slab-dashboard/SectionTitle";

type RecentActivitySectionProps = { guest?: boolean };

const items = [
  {
    icon: "check_circle" as const,
    iconWrap: "bg-tertiary-fixed/20 text-on-tertiary-container",
    title: "Lock Notice Sent",
    detail: "CCIP Message ID: 0x4f...a3e",
    status: "Success",
    statusClass: "text-on-tertiary-container",
    time: "2 mins ago",
  },
  {
    icon: "sync" as const,
    iconWrap: "bg-secondary-fixed/30 text-secondary",
    title: "Cross-Chain Sync",
    detail: "Updating Sepolia state",
    status: "In Progress",
    statusClass: "text-secondary",
    time: "15 mins ago",
  },
] as const;

export function RecentActivitySection({ guest = false }: RecentActivitySectionProps) {
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

  return (
    <section>
      <SectionTitle title="Recent Activity" />
      <PanelCard variant="panelTight">
        <div className="divide-y divide-outline-variant/10">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-zinc-100"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${item.iconWrap}`}
                >
                  <Icon name={item.icon} className="!text-xl" />
                </div>
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{item.detail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${item.statusClass}`}>{item.status}</p>
                <p className="text-[10px] text-on-surface-variant">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 text-center">
          <SlabButton variant="textLink">View Transaction History</SlabButton>
        </div>
      </PanelCard>
    </section>
  );
}
