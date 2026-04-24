import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-[28px] border border-outline-variant/10 bg-surface/8 px-6 py-10 shadow-card md:px-10">
        <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[rgba(0,255,34,0.12)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <p className="inline-flex w-fit rounded-full border border-outline-variant/15 bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-semibold tracking-wide text-text-primary/70">
            Cross-chain NFT lending UI
          </p>

          <div className="space-y-3">
            <h1 className="text-balance font-headline text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Borrow liquidity against your collectibles.
              <span className="block text-gradient-brand">Instantly.</span>
            </h1>
            <p className="max-w-2xl text-pretty text-base text-text-primary/70 md:text-lg">
              A premium dark-finance interface with a signature neon navigation system. This page is intentionally hardcoded so you can iterate on layout, typography, and tokens without backend dependencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LinkButton to="/icons" variant="primary">
              Explore components
            </LinkButton>
            <LinkButton to="/icons" variant="accent" className="shadow-card">
              View icon system
            </LinkButton>
            <a
              href="https://tailwindcss.com/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-[100px] bg-surface/10 px-5 py-2 text-xs font-medium text-text-primary shadow-card hover:bg-surface/15"
            >
              Tailwind docs
            </a>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-text-primary/60">
            <span className="rounded-full border border-outline-variant/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1">
              Geologica typography
            </span>
            <span className="rounded-full border border-outline-variant/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1">
              Tokenized colors
            </span>
            <span className="rounded-full border border-outline-variant/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1">
              MCP sidebar fidelity
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="rounded-2xl border border-outline-variant/10 bg-surface/8 px-6 py-5 shadow-card-sm">
          <div className="text-sm font-semibold">Design fast</div>
          <div className="mt-2 text-sm text-text-primary/70">
            Drop in hardcoded data, tune spacing/typography, and ship reusable components.
          </div>
        </Card>
        <Card className="rounded-2xl border border-outline-variant/10 bg-surface/8 px-6 py-5 shadow-card-sm">
          <div className="text-sm font-semibold">No wallet required</div>
          <div className="mt-2 text-sm text-text-primary/70">
            Demo mode bypasses AppKit + chain sync so you won’t see network switch prompts.
          </div>
        </Card>
        <Card className="rounded-2xl border border-outline-variant/10 bg-surface/8 px-6 py-5 shadow-card-sm">
          <div className="text-sm font-semibold">Ready for real flow</div>
          <div className="mt-2 text-sm text-text-primary/70">
            When you’re ready, disable demo mode and wire components to live data.
          </div>
        </Card>
      </section>

      <section className="rounded-3xl border border-outline-variant/10 bg-surface/8 px-6 py-8 shadow-card md:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-lg font-bold">Start building</div>
            <div className="text-sm text-text-primary/70">
              Add sections here (hero, stats, cards, tables) and keep everything hardcoded.
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton to="/" variant="accent">
              Dashboard
            </LinkButton>
            <LinkButton to="/icons" variant="accent">
              Icons demo
            </LinkButton>
            <a
              href="https://tailwindcss.com/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-[100px] bg-surface/10 px-5 py-2 text-xs font-medium text-text-primary shadow-card hover:bg-surface/15"
            >
              Tailwind docs
            </a>
          </div>
        </div>
      </section>

      <div className="text-xs text-text-primary/50">
        Tip: try the <Link to="/icons" className="text-brand hover:underline">icons page</Link> to verify hover/active nav states.
      </div>
    </div>
  );
}

