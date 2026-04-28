import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dashboard MCP-driven semantic tokens (use CSS variables as source of truth).
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",

        // Container surface ladder (dark UI, translucent white).
        // Used widely in existing components; keep consistent with sidebar MCP.
        "surface-container-lowest": "rgba(255,255,255,0.04)",
        "surface-container-low": "rgba(255,255,255,0.06)",
        "surface-container": "rgba(255,255,255,0.08)",
        "surface-container-high": "rgba(255,255,255,0.10)",
        "surface-container-highest": "rgba(255,255,255,0.12)",

        // M3-ish aliases used across the app (kept for compatibility).
        "on-surface": "rgb(var(--text-primary) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--text-muted) / <alpha-value>)",
        secondary: "rgb(var(--brand) / <alpha-value>)",
        "secondary-container": "rgba(0,255,34,0.12)",
        "secondary-fixed": "rgba(0,255,34,0.28)",
        "secondary-fixed-dim": "rgba(0,255,34,0.18)",
        "tertiary-fixed-dim": "rgb(var(--warning) / <alpha-value>)",
        "outline-variant": "rgb(var(--border) / <alpha-value>)",

        // Sidebar helpers (used by mobile nav/back-compat).
        "slab-sidebar-bg": "rgba(0,0,0,0.72)",
        "slab-sidebar-active-bg": "rgba(255,255,255,0.08)",

        // Back-compat aliases used around the app.
        on: {
          surface: "rgb(var(--text-primary) / <alpha-value>)",
          "surface-variant": "rgb(var(--text-muted) / <alpha-value>)",
          primary: "rgb(var(--background) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--text-primary) / <alpha-value>)",
          container: "rgb(var(--text-secondary) / <alpha-value>)",
        },
        outline: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          variant: "rgb(var(--border) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Geologica", "system-ui", "sans-serif"],
        headline: ["Geologica", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // MCP shadows (note negative X offset).
        card: "-4px 4px 30px 0 rgba(0,0,0,0.4)",
        "card-sm": "-4px 4px 8px 0 rgba(0,0,0,0.25)",
        icon: "-2px 2px 8px 0 rgba(0,0,0,0.35)",

        // Legacy names used by existing UI.
        slab: "0 12px 34px rgba(0,0,0,0.45)",
        "slab-md": "0 22px 60px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        "brand-gradient": "var(--gradient-brand)",
        "warning-gradient": "var(--gradient-warning)",
        "danger-gradient": "var(--gradient-danger)",
        "info-gradient": "linear-gradient(184deg, rgb(var(--info)) 10.472%, rgb(var(--info-soft)) 87.188%)",
      },
    },
  },
  plugins: [],
};
export default config;
