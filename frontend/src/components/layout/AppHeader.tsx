import { AppKitButton } from "@reown/appkit/react";
import { HEADER_HEIGHT_CLASS } from "@/components/layout/shellConstants";
import { HeaderPortfolioMetrics } from "@/components/layout/HeaderPortfolioMetrics";

const demoMode = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

export function AppHeader() {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex ${HEADER_HEIGHT_CLASS} items-center justify-between gap-3 border-b border-outline-variant/10 bg-surface/80 px-4 shadow-sm backdrop-blur-xl md:left-64 md:right-0 md:gap-4 md:px-8`}
    >
      <HeaderPortfolioMetrics />
      {!demoMode && (
        <div className="relative z-10 shrink-0">
          <AppKitButton />
        </div>
      )}
    </header>
  );
}
