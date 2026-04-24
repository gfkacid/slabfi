import { Link, NavLink } from "react-router-dom";

import logoFull from "@/assets/svgs/logo-full.svg";
import hammerCourt from "@/assets/svgs/hammer-court.svg";

import { SIDEBAR_WIDTH_CLASS } from "@/components/layout/shellConstants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

import grid from "bootstrap-icons/icons/grid.svg?url";
import gridFill from "bootstrap-icons/icons/grid-fill.svg?url";
import filePost from "bootstrap-icons/icons/file-post.svg?url";
import filePostFill from "bootstrap-icons/icons/file-post-fill.svg?url";
import bank from "bootstrap-icons/icons/bank.svg?url";
import questionCircle from "bootstrap-icons/icons/question-circle.svg?url";
import gear from "bootstrap-icons/icons/gear.svg?url";
import boxArrowLeft from "bootstrap-icons/icons/box-arrow-left.svg?url";

type SidebarItem = {
  to: string;
  label: string;
  iconUrl: string;
  iconActiveUrl?: string;
  disabled?: boolean;
};

const navItems: SidebarItem[] = [
  {
    to: "/",
    label: "Dashboard",
    iconUrl: grid,
    iconActiveUrl: gridFill,
  },
  {
    to: "/collectibles",
    label: "Collectibles",
    iconUrl: filePost,
    iconActiveUrl: filePostFill,
  },
  {
    to: "/lending",
    label: "Lending Hub",
    iconUrl: bank,
    disabled: true,
  },
  {
    to: "/auctions",
    label: "Auctions",
    iconUrl: hammerCourt,
    disabled: true,
  },
];

function MaskIcon({
  url,
  className,
  active,
}: {
  url: string;
  className: string;
  active: boolean;
}) {
  return (
    <span
      className={cn(className, active ? "" : "bg-current")}
      style={{
        backgroundImage: active ? "var(--gradient-brand)" : undefined,
        WebkitMaskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        maskImage: `url(${url})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
      aria-hidden="true"
    />
  );
}

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
              {navItems.map(({ to, label, iconUrl, iconActiveUrl, disabled }) => {
                if (disabled) {
                  return (
                    <div
                      key={`${to}-${label}`}
                      className="flex size-[64px] items-center justify-center rounded-[100px] p-[14px] opacity-40"
                      aria-label={`${label} (coming soon)`}
                      title={`${label} (coming soon)`}
                    >
                      <div className="opacity-50">
                        <MaskIcon url={iconUrl} className="block size-[28px]" active={false} />
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
                                <MaskIcon
                                  url={isActive ? iconActiveUrl || iconUrl : iconUrl}
                                  className="block size-[28px]"
                                  active={isActive}
                                />
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
                { label: "Help", iconUrl: questionCircle },
                { label: "Settings", iconUrl: gear },
                { label: "Exit", iconUrl: boxArrowLeft },
              ].map(({ label, iconUrl }) => (
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
                          <MaskIcon url={iconUrl} className="block size-[28px]" active={false} />
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
