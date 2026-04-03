import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PillTabs } from "@/components/tabs/PillTabs";
import { LendingSidebar } from "@/components/shared/lending/LendingSidebar";
import {
  LENDING_HUB_TABS,
  lendingHubPanelFor,
  type LendingTabId,
} from "@/components/lending/lendingHubRegistry";

function lendingTabFromSearch(tabParam: string | null): LendingTabId {
  if (tabParam === "borrow" || tabParam === "repay") return tabParam;
  return "deposit";
}

export function StitchLendingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(
    () => lendingTabFromSearch(searchParams.get("tab")),
    [searchParams],
  );

  const setActiveTab = useCallback(
    (id: LendingTabId) => {
      setSearchParams(
        id === "deposit" ? {} : { tab: id },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const ActivePanel = lendingHubPanelFor(activeTab);

  return (
    <div className="-mx-6 min-h-full bg-zinc-50 px-6 text-on-surface md:-mx-10 md:px-10">
      <header className="mb-6">
        <h1 className="font-headline text-2xl font-extrabold text-primary">Lending Hub</h1>
        <p className="text-xs font-medium text-on-surface-variant">
          Deposit, borrow, and repay USDC on the hub — one workspace.
        </p>
      </header>

      <PillTabs tabs={LENDING_HUB_TABS} activeId={activeTab} onChange={setActiveTab} className="mb-8" />

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 space-y-8 lg:col-span-8">
          <ActivePanel />
        </div>
        <aside className="col-span-12 lg:col-span-4">
          <LendingSidebar />
        </aside>
      </div>
    </div>
  );
}
