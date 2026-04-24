const ICONS = [
  { name: "Search", className: "bi-search" },
  { name: "Person", className: "bi-person" },
  { name: "Heart", className: "bi-heart" },
  { name: "Bell", className: "bi-bell" },
  { name: "Gear", className: "bi-gear" },
] as const;

export function IconsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-black tracking-tight md:text-4xl">
          Collectibles (demo)
        </h1>
        <p className="max-w-2xl text-sm text-text-primary/70 md:text-base">
          Icons are global (loaded once in <code className="rounded bg-surface/10 px-1 font-mono">main.tsx</code>), inherit
          current text color, and can be resized with Tailwind <code className="rounded bg-surface/10 px-1 font-mono">text-*</code>{" "}
          utilities.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ICONS.map((icon) => (
          <div
            key={icon.className}
            className="flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface/8 px-5 py-4 shadow-card-sm"
          >
            <i className={`bi ${icon.className} text-2xl`} aria-hidden="true" />
            <div className="flex flex-col">
              <div className="text-sm font-semibold">{icon.name}</div>
              <div className="text-xs text-text-primary/60">
                <code className="rounded bg-surface/10 px-1 font-mono">bi {icon.className}</code>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface/8 px-6 py-5 shadow-card-sm">
        <div className="text-sm font-semibold">Sizing + color inheritance</div>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-primary/60">Small</span>
            <i className="bi bi-heart text-sm" aria-hidden="true" />
            <i className="bi bi-heart text-base" aria-hidden="true" />
            <i className="bi bi-heart text-lg" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 text-secondary">
            <span className="text-xs text-text-primary/60">Inherits color</span>
            <i className="bi bi-bell text-xl" aria-hidden="true" />
            <i className="bi bi-bell text-2xl" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  );
}

