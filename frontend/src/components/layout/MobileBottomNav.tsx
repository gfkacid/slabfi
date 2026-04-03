import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";

const items = [
  { to: "/", label: "Home", icon: "dashboard" as const },
  { to: "/assets", label: "Assets", icon: "account_balance_wallet" as const },
  { to: "/lending", label: "Lend", icon: "account_balance" as const },
  { to: "/", label: "Menu", icon: "settings" as const },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] flex h-16 items-center justify-around border-t border-outline-variant/20 bg-slab-sidebar-bg/95 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-lg md:hidden">
      {items.map(({ to, label, icon }) => (
        <NavLink
          key={`${to}-${label}`}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors ${
              isActive
                ? "bg-slab-sidebar-active-bg font-semibold text-blue-600 ring-1 ring-blue-500/15"
                : "text-on-surface-variant"
            }`
          }
        >
          <Icon name={icon} className="!text-2xl" />
          <span className="text-[8px] font-bold">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
