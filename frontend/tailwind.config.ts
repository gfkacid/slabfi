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
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(184deg, rgb(var(--brand)) 10.472%, rgb(var(--brand-soft)) 87.188%)",
        "danger-gradient": "linear-gradient(184deg, rgb(var(--danger)) 10.472%, rgb(var(--danger-soft)) 87.188%)",
        "warning-gradient": "linear-gradient(184deg, rgb(var(--warning)) 10.472%, rgb(var(--warning-soft)) 87.188%)",
        "info-gradient": "linear-gradient(184deg, rgb(var(--info)) 10.472%, rgb(var(--info-soft)) 87.188%)",
      },
    },
  },
  plugins: [],
};
export default config;
