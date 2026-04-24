import { Link } from "react-router-dom";

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col gap-10">
          <header className="space-y-4">
            <p className="inline-flex w-fit rounded-full border border-outline-variant/20 bg-surface/70 px-3 py-1 text-xs font-semibold tracking-wide text-on-surface/70">
              Demo mode (hardcoded UI)
            </p>
            <h1 className="text-balance font-headline text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Slab.Finance UI Playground
            </h1>
            <p className="max-w-2xl text-pretty text-base text-on-surface/70 md:text-lg">
              Build screens and components without wallets, chains, or backend dependencies. This route is intentionally
              static so you can iterate quickly on layout and styling.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/15 bg-surface px-6 py-5 shadow-sm">
              <div className="text-sm font-semibold">Design fast</div>
              <div className="mt-2 text-sm text-on-surface/70">
                Drop in hardcoded data, tune spacing/typography, and ship reusable components.
              </div>
            </div>
            <div className="rounded-2xl border border-outline-variant/15 bg-surface px-6 py-5 shadow-sm">
              <div className="text-sm font-semibold">No wallet required</div>
              <div className="mt-2 text-sm text-on-surface/70">
                Demo mode bypasses AppKit + chain sync so you won’t see network switch prompts.
              </div>
            </div>
            <div className="rounded-2xl border border-outline-variant/15 bg-surface px-6 py-5 shadow-sm">
              <div className="text-sm font-semibold">Ready for real flow</div>
              <div className="mt-2 text-sm text-on-surface/70">
                When you’re ready, disable demo mode and wire components to live data.
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-outline-variant/15 bg-gradient-to-br from-surface to-zinc-50 px-6 py-8 shadow-sm md:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-bold">Start building</div>
                <div className="text-sm text-on-surface/70">
                  Add sections here (hero, stats, cards, tables) and keep everything hardcoded.
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
                >
                  Dashboard (this page)
                </Link>
                <Link
                  to="/icons"
                  className="inline-flex items-center justify-center rounded-xl border border-outline-variant/20 bg-surface px-4 py-2 text-sm font-semibold text-on-surface/80 shadow-sm transition-colors hover:bg-surface/70 active:bg-surface/60"
                >
                  Icons demo
                </Link>
                <a
                  href="https://tailwindcss.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-outline-variant/20 bg-surface px-4 py-2 text-sm font-semibold text-on-surface/80 shadow-sm transition-colors hover:bg-surface/70 active:bg-surface/60"
                >
                  Tailwind docs
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

