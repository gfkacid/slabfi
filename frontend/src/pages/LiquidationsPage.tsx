import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { LIQUIDATION_MANAGER_ABI, ERC20_ABI } from "@slabfinance/shared";
import {
  useActiveAuctionRows,
  usePlaceBid,
  useClaimAuction,
  useProtocolStats,
  useAuctionHistory,
} from "@/hooks";
import { PillTabs } from "@/components/tabs/PillTabs";
import { LIQUIDATION_QUEUE_TABS, type LiquidationTabId } from "@/components/liquidation/liquidationTypes";
import { liquidationTabMeta } from "@/components/liquidation/liquidationTabMeta";
import type { LiquidationStatItem } from "@/components/liquidation/liquidationTabMeta";
import { LiquidationStatGrid } from "@/components/liquidation/LiquidationStatGrid";
import { LiquidationPromoCard } from "@/components/liquidation/LiquidationPromoCard";
import { ActiveLiquidationsTable } from "@/components/liquidation/ActiveLiquidationsTable";
import { HistoryLiquidationsTable } from "@/components/liquidation/HistoryLiquidationsTable";
import type { AuctionRow } from "@/components/liquidation/ActiveQueueTableRow";
import { hubChain, hubContracts } from "@/lib/hub";
import { PageHeader } from "@/components/PageHeader";
import {
  formatUsdFromSnapshotString,
  utilizationPercentFromSnapshotWad,
} from "@/lib/hubFormat";

export function LiquidationsPage() {
  const [activeTab, setActiveTab] = useState<LiquidationTabId>("active");
  const meta = liquidationTabMeta[activeTab];
  const { isConnected, chainId } = useAccount();
  const { data: auctions, isLoading } = useActiveAuctionRows();
  const { writeContractAsync } = usePlaceBid();
  const { writeContractAsync: writeClaimAsync } = useClaimAuction();
  const { data: protocol } = useProtocolStats();
  const { data: history } = useAuctionHistory(1, 1);

  const isHubChain = chainId === hubChain.id;
  const managerAddr = hubContracts.liquidationManager;
  const usdcAddr = hubContracts.usdc;

  const active = auctions ?? [];

  const statItems = useMemo((): readonly LiquidationStatItem[] => {
    const snap = protocol?.latestSnapshot;
    const tvl =
      snap?.totalAssets != null
        ? `$${formatUsdFromSnapshotString(snap.totalAssets)}`
        : "—";

    if (activeTab === "active") {
      return [
        {
          label: "Active auctions (on-chain)",
          value: String(active.length),
          hint: hubChain.name,
          hintClassName: "text-sm font-medium text-on-surface-variant",
        },
        {
          label: "Open positions (indexer)",
          value: protocol?.positionCount != null ? String(protocol.positionCount) : "—",
        },
        {
          label: "Protocol TVL",
          value: tvl,
        },
      ];
    }

    const util = utilizationPercentFromSnapshotWad(snap?.utilizationWad);
    return [
      {
        label: "Resolved auctions (indexer)",
        value: history?.total != null ? String(history.total) : "—",
      },
      {
        label: "Protocol TVL",
        value: tvl,
      },
      {
        label: "Utilization",
        value: util !== undefined ? `${Math.round(util)}%` : "—",
      },
    ];
  }, [activeTab, active.length, protocol, history?.total]);

  const gate =
    !isConnected ? (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        Connect your wallet to view and place bids on active auctions.
      </div>
    ) : !isHubChain ? (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        Switch to {hubChain.name} to interact with liquidations.
      </div>
    ) : undefined;

  const handlePlaceBid = async (entry: AuctionRow, amountWei: bigint) => {
    if (!managerAddr || !usdcAddr) return;
    await writeContractAsync({
      address: usdcAddr,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [managerAddr, amountWei],
    });
    await writeContractAsync({
      address: managerAddr,
      abi: LIQUIDATION_MANAGER_ABI,
      functionName: "placeBid",
      args: [entry.auctionId, amountWei],
    });
  };

  const handleClaim = async (entry: AuctionRow) => {
    if (!managerAddr) return;
    await writeClaimAsync({
      address: managerAddr,
      abi: LIQUIDATION_MANAGER_ABI,
      functionName: "claim",
      args: [entry.auctionId],
    });
  };

  return (
    <div className="-mx-6 min-h-full bg-zinc-50 px-6 text-on-surface md:-mx-10 md:px-10">
      <PageHeader
        title="Liquidations"
        description="When health factor drops below 1, each collateral card is auctioned. Bids are in USDC; anti-sniping extends the deadline. After closing, anyone can claim to settle: debt and fee routing is handled on-chain."
      />

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PillTabs
          tabs={LIQUIDATION_QUEUE_TABS}
          activeId={activeTab}
          onChange={setActiveTab}
          ariaLabel="Liquidation queue"
          idPrefix="liquidation"
          className="shrink-0"
        />
      </div>

      <LiquidationStatGrid items={statItems} />

      <div
        role="tabpanel"
        id={`liquidation-panel-${activeTab}`}
        aria-labelledby={`liquidation-tab-${activeTab}`}
      >
        {activeTab === "active" ? (
          <ActiveLiquidationsTable
            entries={active}
            isLoading={isLoading}
            onPlaceBid={handlePlaceBid}
            onClaim={handleClaim}
            gate={gate}
          />
        ) : (
          <HistoryLiquidationsTable />
        )}
      </div>

      <LiquidationPromoCard config={meta.promo} />
    </div>
  );
}
