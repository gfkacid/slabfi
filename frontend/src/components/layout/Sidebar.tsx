import { Link, NavLink } from "react-router-dom";

import hammerCourt from "@/assets/svgs/hammer-court.svg";
import logoFull from "@/assets/svgs/logo-full.svg";

import { SIDEBAR_WIDTH_CLASS } from "@/components/layout/shellConstants";
import { BootstrapIcon, type BootstrapIconName, MaskedSvgIcon } from "@/components/ui/BootstrapIcon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

type SidebarItem = {
  to: string;
  label: string;
  icon?: BootstrapIconName;
  iconActive?: BootstrapIconName;
  iconUrl?: string;
};

const NAV_ITEMS: SidebarItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: "grid",
    iconActive: "grid-fill",
  },
  {
    to: "/collectibles",
    label: "Collectibles",
    icon: "file-post",
    iconActive: "file-post-fill",
  },
  {
    to: "/lending",
    label: "Lending Hub",
    icon: "bank",
  },
  {
    to: "/auctions",
    label: "Auctions",
    iconUrl: hammerCourt,
  },
];

const UTILITY_ITEMS: Array<{ label: string; icon: BootstrapIconName }> = [
  { label: "Help", icon: "question-circle" },
  { label: "Settings", icon: "gear" },
  { label: "Exit", icon: "box-arrow-left" },
];

function SidebarNavItem({ to, label, icon, iconActive, iconUrl }: SidebarItem) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          end={to === "/"}
          aria-label={label}
          className={({ isActive }) =>
            cn(
              "group relative flex size-[64px] items-center justify-center rounded-[100px] p-[14px]",
              "transition-[transform,background-color,box-shadow,filter] active:scale-[0.98]",
              "hover:bg-white/5",
              isActive && "bg-white/5 shadow-[-4px_4px_30px_0_rgba(0,0,0,0.40)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )
          }
        >
          {({ isActive }) => (
            <div className="size-[28px] transition-transform group-hover:scale-[1.06]">
              <div className={cn(isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80")}>
                {icon ? (
                  <BootstrapIcon
                    name={isActive ? iconActive || icon : icon}
                    className="size-[28px]"
                    gradient={isActive}
                  />
                ) : iconUrl ? (
                  <MaskedSvgIcon url={iconUrl} className="size-[28px]" gradient={isActive} />
                ) : null}
              </div>
            </div>
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  return (
    <aside
      className={`sticky top-0 z-[60] hidden h-screen flex-col bg-background md:flex ${SIDEBAR_WIDTH_CLASS}`}
    >
      <TooltipProvider delayDuration={250}>
        <div className="flex h-full flex-col items-center gap-10 py-10 ">
          <Link
            to="/"
            className="flex h-[110px]  flex-col items-center justify-center"
            aria-label="Slab.Fi"
          >
            <img
              src={logoFull}
              alt="Slab.Fi"
              className="h-[110px] w-[69px] select-none"
              draggable={false}
            />
          </Link>

          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-between rounded-[50px] bg-white/10 px-2 py-4">
              <div className="flex w-[64px] flex-col items-center gap-5">
                {NAV_ITEMS.map((item) => (
                  <SidebarNavItem key={item.to} {...item} />
                ))}
              </div>

              <div className="flex w-[64px] flex-col items-center gap-5">
                {UTILITY_ITEMS.map(({ label, icon }) => (
                  <Tooltip key={label}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "group flex size-[64px] items-center justify-center rounded-[100px] p-[14px]",
                          "transition-[transform,background-color,filter] hover:bg-white/[0.04] hover:brightness-110 active:scale-[0.98]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        )}
                        aria-label={label}
                      >
                        <div className="size-[28px] opacity-50 transition-opacity group-hover:opacity-80">
                          <BootstrapIcon name={icon} className="size-[28px]" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </aside>
  );
}
