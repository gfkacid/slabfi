import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BootstrapIcon } from "@/components/ui/BootstrapIcon";

import hammerCourt from "@/assets/svgs/hammer-court.svg";

type MobileNavItem = {
  to: string;
  label: string;
  icon: string;
  iconActive?: string;
  disabled?: boolean;
};

const items: MobileNavItem[] = [
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
    label: "Lending",
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

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] md:hidden">
      <div className="mx-auto flex h-16 max-w-[560px] items-center justify-between gap-2 px-4 pb-4">
        <div className="flex w-full items-center justify-around rounded-[999px] border border-outline-variant/10 bg-surface/8 px-3 py-2 shadow-[0_-14px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {items.map(({ to, label, icon, iconActive, disabled }) => {
            if (disabled) {
              return (
                <div
                  key={`${to}-${label}`}
                  className="flex w-14 flex-col items-center justify-center gap-1 rounded-[14px] py-1 opacity-40"
                  aria-label={`${label} (coming soon)`}
                  title={`${label} (coming soon)`}
                >
                  <div className="text-text-primary/70">
                    {icon === "hammer" ? (
                      <span
                        className="block size-[22px] bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                        style={{ WebkitMaskImage: `url(${hammerCourt})`, maskImage: `url(${hammerCourt})` }}
                        aria-hidden="true"
                      />
                    ) : (
                      <BootstrapIcon name={icon} className="block text-[22px] leading-none" />
                    )}
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
                    <div className={cn(isActive ? "text-brand" : "text-text-primary/60")}>
                      {icon === "hammer" ? (
                        <span
                          className="block size-[22px] bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                          style={{ WebkitMaskImage: `url(${hammerCourt})`, maskImage: `url(${hammerCourt})` }}
                          aria-hidden="true"
                        />
                      ) : (
                        <BootstrapIcon
                          name={isActive ? iconActive || `${icon}-fill` : icon}
                          className="block text-[22px] leading-none"
                        />
                      )}
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
