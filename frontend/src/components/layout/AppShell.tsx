import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MAIN_OFFSET_CLASS } from "@/components/layout/shellConstants";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary">
      <div className="mx-auto min-h-screen w-full max-w-[1920px] bg-background px-10">
        <div className="flex min-h-screen flex-row gap-14">
          <Sidebar />
          <div className={`min-w-0 flex-1 ${MAIN_OFFSET_CLASS}`}>
            <div className="-mx-10">
              <AppHeader />
            </div>
            <main className="pb-20 md:pb-0">
              <div className="mx-auto py-8">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
