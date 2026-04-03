import { NavLink, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { Icon } from "@/components/ui/Icon";
import { SIDEBAR_WIDTH_CLASS } from "@/components/layout/shellConstants";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" as const },
  { to: "/assets", label: "Assets", icon: "account_balance_wallet" as const },
  { to: "/lending", label: "Lending Hub", icon: "account_balance" as const },
  { to: "/liquidations", label: "Liquidation Queue", icon: "list_alt" as const },
];

function truncateAddress(addr: string) {
  return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}

/** Cursor MCP–style nav: rounded row, light blue wash, inset left accent bar */
const linkBase =
  "relative mx-1 flex items-center gap-3 rounded-md px-3 py-2.5 font-headline text-sm font-medium tracking-tight transition-[color,background-color,box-shadow] active:scale-[0.98]";
const linkIdle = "text-zinc-600 hover:bg-zinc-200/70";
const linkActive =
  "bg-slab-sidebar-active-bg font-semibold text-blue-600 shadow-[inset_3px_0_0_0_theme(colors.blue.500)] ring-1 ring-blue-500/15";

export function Sidebar() {
  const { address, isConnected } = useAccount();

  return (
    <aside
      className={`fixed left-0 top-0 z-[60] hidden h-screen flex-col ${SIDEBAR_WIDTH_CLASS} border-r border-outline-variant/20 bg-zinc-100 md:flex`}
    >
      <div className="p-8 pb-4">
        <Link
          to="/"
          className="mb-8 block font-headline text-xl font-extrabold text-primary"
        >
          Slab.Finance
        </Link>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle}`.trim()
              }
            >
              <Icon name={icon} className="!text-xl" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-outline-variant/10 p-8">
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-high p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/40 font-headline text-xs font-bold text-primary">
            {isConnected ? address?.slice(2, 4).toUpperCase() ?? "?" : "—"}
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-xs font-bold text-on-surface">
              {isConnected && address ? truncateAddress(address) : "Not connected"}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {isConnected ? "Connected" : "Disconnected"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
