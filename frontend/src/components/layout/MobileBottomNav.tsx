import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

import hammerCourt from "@/assets/svgs/hammer-court.svg";

import grid from "bootstrap-icons/icons/grid.svg?url";
import gridFill from "bootstrap-icons/icons/grid-fill.svg?url";
import filePost from "bootstrap-icons/icons/file-post.svg?url";
import filePostFill from "bootstrap-icons/icons/file-post-fill.svg?url";
import bank from "bootstrap-icons/icons/bank.svg?url";

type MobileNavItem = {
  to: string;
  label: string;
  iconUrl: string;
  iconActiveUrl?: string;
  disabled?: boolean;
};

const items: MobileNavItem[] = [
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
    label: "Lending",
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

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] md:hidden">
      <div className="mx-auto flex h-16 max-w-[560px] items-center justify-between gap-2 px-4 pb-4">
        <div className="flex w-full items-center justify-around rounded-[999px] border border-outline-variant/10 bg-surface/8 px-3 py-2 shadow-[0_-14px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {items.map(({ to, label, iconUrl, iconActiveUrl, disabled }) => {
            if (disabled) {
              return (
                <div
                  key={`${to}-${label}`}
                  className="flex w-14 flex-col items-center justify-center gap-1 rounded-[14px] py-1 opacity-40"
                  aria-label={`${label} (coming soon)`}
                  title={`${label} (coming soon)`}
                >
                  <div className="text-text-primary/70">
                    <MaskIcon url={iconUrl} className="block size-[22px]" active={false} />
                  </div>
                  <span className="text-[9px] font-bold tracking-tight text-text-primary/70">
                    {label}
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={`${to}-${label}`}
                to={to}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    "group flex w-14 flex-col items-center justify-center gap-1 rounded-[14px] py-1 transition-[transform,background-color,box-shadow]",
                    isActive
                      ? "bg-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(0,255,34,0.12),0_10px_30px_rgba(0,0,0,0.55)]"
                      : "hover:bg-[rgba(255,255,255,0.04)] active:scale-[0.98]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(isActive ? "" : "text-text-primary/60")}>
                      <MaskIcon
                        url={isActive ? iconActiveUrl || iconUrl : iconUrl}
                        className="block size-[22px]"
                        active={isActive}
                      />
                    </div>
                    <span className="text-[9px] font-bold tracking-tight text-text-primary/70">
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
