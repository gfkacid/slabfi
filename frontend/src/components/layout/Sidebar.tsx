import { NavLink, Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { SIDEBAR_WIDTH_CLASS } from "@/components/layout/shellConstants";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" as const },
];

const linkBase =
  "relative mx-1 flex items-center justify-center rounded-[100px] p-[14px] transition-[filter,transform,background-color,box-shadow] active:scale-[0.98]";
const linkIdle = "text-text-primary/50 hover:bg-surface/10";
const linkActive = "bg-surface/10 text-text-primary shadow-card";

export function Sidebar() {
  return (
    <aside
      className={`fixed left-0 top-0 z-[60] hidden h-screen flex-col ${SIDEBAR_WIDTH_CLASS} bg-background md:flex`}
    >
      <div className="p-10 pb-6">
        <Link
          to="/"
          className="mb-10 block font-headline text-xl font-extrabold tracking-tight text-text-primary"
        >
          <span className="text-gradient-brand">Slab.</span>Fi
        </Link>
        <nav className="flex w-full flex-col items-center gap-5 rounded-[50px] bg-surface/8 p-4">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle}`.trim()
              }
              aria-label={label}
              title={label}
            >
              <Icon name={icon} className="!text-[28px]" />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-outline-variant/10 p-8">
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-high p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/40 font-headline text-xs font-bold text-primary">
            D
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-xs font-bold text-on-surface">
              Demo mode
            </p>
            <p className="text-[10px] text-on-surface-variant">
              Hardcoded UI
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
