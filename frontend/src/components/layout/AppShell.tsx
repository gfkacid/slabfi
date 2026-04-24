import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { HEADER_TOP_PAD_CLASS, MAIN_OFFSET_CLASS } from "@/components/layout/shellConstants";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary">
      <Sidebar />
      <AppHeader />
      <main
        className={`min-h-screen bg-background ${MAIN_OFFSET_CLASS} ${HEADER_TOP_PAD_CLASS} pb-20 md:pb-0`}
      >
        <div className="mx-auto max-w-[1600px] px-6 py-8 md:px-10">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
