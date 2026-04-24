import { AppKitButton } from "@reown/appkit/react";
import { HEADER_HEIGHT_CLASS } from "@/components/layout/shellConstants";
import { HeaderPortfolioMetrics } from "@/components/layout/HeaderPortfolioMetrics";

const demoMode = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

export function AppHeader() {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex ${HEADER_HEIGHT_CLASS} items-center justify-between gap-3 border-b border-outline-variant/10 bg-surface/80 px-4 shadow-sm backdrop-blur-xl md:left-64 md:right-0 md:gap-4 md:px-8`}
    >
      {demoMode ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="inline-flex shrink-0 rounded-full border border-outline-variant/15  px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-primary/70">
            Demo mode
          </span>
          <span className="truncate text-xs text-text-primary/60">
            Wallet + live protocol reads disabled.
          </span>
        </div>
      ) : (
        <HeaderPortfolioMetrics />
      )}
      {!demoMode && (
        <div className="relative z-10 shrink-0">
          <AppKitButton />
        </div>
      )}
    </header>
  );
}
