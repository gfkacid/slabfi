import { Link, NavLink } from "react-router-dom";

import logoFull from "@/assets/svgs/logo-full.svg";
import hammerCourt from "@/assets/svgs/hammer-court.svg";

import { SIDEBAR_WIDTH_CLASS } from "@/components/layout/shellConstants";
import { BootstrapIcon } from "@/components/ui/BootstrapIcon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

type SidebarItem = {
  to: string;
  label: string;
  icon: string;
  iconActive?: string;
  disabled?: boolean;
};

const navItems: SidebarItem[] = [
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
    disabled: true,
  },
  {
    to: "/auctions",
    label: "Auctions",
    icon: "hammer",
    disabled: true,
  },
];

export function Sidebar() {
  return (
    <aside
      className={`fixed left-0 top-0 z-[60] hidden h-screen flex-col ${SIDEBAR_WIDTH_CLASS} bg-background md:flex`}
    >
      <div className="flex h-full flex-col items-center gap-10 p-10 pb-8">
        <Link
          to="/"
          className="flex h-[110px] w-full flex-col items-center justify-center"
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
          <div className="flex flex-1 flex-col items-center justify-between rounded-[50px] bg-[rgba(255,255,255,0.08)] p-4">
            <div className="flex w-[64px] flex-col items-center gap-5">
              {navItems.map(({ to, label, icon, iconActive, disabled }) => {
                if (disabled) {
                  return (
                    <div
                      key={`${to}-${label}`}
                      className="flex size-[64px] items-center justify-center rounded-[100px] p-[14px] opacity-40"
                      aria-label={`${label} (coming soon)`}
                      title={`${label} (coming soon)`}
                    >
                      <div className="opacity-50">
                        {icon === "hammer" ? (
                          <span
                            className="block size-[28px] bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                            style={{
                              WebkitMaskImage: `url(${hammerCourt})`,
                              maskImage: `url(${hammerCourt})`,
                            }}
                            aria-hidden="true"
                          />
                        ) : (
                          <BootstrapIcon name={icon} className="block text-[28px] leading-none" />
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <TooltipProvider delayDuration={250} key={`${to}-${label}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={to}
                          aria-label={label}
                          className={({ isActive }) =>
                            cn(
                              "group relative flex size-[64px] items-center justify-center rounded-[100px] p-[14px]",
                              "transition-[transform,background-color,box-shadow,filter] active:scale-[0.98]",
                              isActive
                                ? "bg-[rgba(255,255,255,0.05)] shadow-[-4px_4px_30px_0px_rgba(0,0,0,0.4)]"
                                : "hover:bg-[rgba(255,255,255,0.02)]",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            )
                          }
                        >
                          {({ isActive }) => (
                            <div className="size-[28px] transition-transform group-hover:scale-[1.06]">
                              <div className={cn(isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80")}>
                                {icon === "hammer" ? (
                                  <span
                                    className="block size-[28px] bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                                    style={{
                                      WebkitMaskImage: `url(${hammerCourt})`,
                                      maskImage: `url(${hammerCourt})`,
                                    }}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <BootstrapIcon
                                    name={isActive ? iconActive || `${icon}-fill` : icon}
                                    className="block text-[28px] leading-none"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>

            <div className="flex w-[64px] flex-col items-center gap-5">
              {[
                { label: "Help", icon: "question-circle" },
                { label: "Settings", icon: "gear" },
                { label: "Exit", icon: "box-arrow-left" },
              ].map(({ label, icon }) => (
                <TooltipProvider delayDuration={250} key={label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "group flex size-[64px] items-center justify-center rounded-[100px] p-[14px]",
                          "transition-[transform,background-color,filter] hover:bg-[rgba(255,255,255,0.02)] hover:brightness-110 active:scale-[0.98]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        )}
                        aria-label={label}
                      >
                        <div className="size-[28px] opacity-50 transition-opacity group-hover:opacity-80">
                          <BootstrapIcon name={icon} className="block text-[28px] leading-none" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
