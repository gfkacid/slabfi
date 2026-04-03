import type { Config } from "tailwindcss";

/**
 * Slab.Finance — zinc-based neutrals.
 * Canvas: zinc-50; primary copy & headings: zinc-900 (via `text-on-surface` / `text-primary`).
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fafafa",
          bright: "#fafafa",
          dim: "#f4f4f5",
          container: "#f4f4f5",
          low: "#f4f4f5",
          high: "#e4e4e7",
          variant: "#d4d4d8",
        },
        "surface-container": {
          /** Same as zinc-100 — avoid pure white (#fff) panels on zinc-50 canvas */
          lowest: "#f4f4f5",
          low: "#f4f4f5",
          DEFAULT: "#e4e4e7",
          high: "#e4e4e7",
          highest: "#d4d4d8",
        },
        on: {
          surface: "#18181b",
          "surface-variant": "#52525b",
          primary: "#ffffff",
          secondary: "#ffffff",
          "primary-container": "#a1a1aa",
          "tertiary-container": "#16a34a",
        },
        primary: {
          DEFAULT: "#18181b",
          container: "#27272a",
          fixed: "#e4e4e7",
          "fixed-dim": "#d4d4d8",
        },
        /** Semantic secondary = Tailwind blue-500 scale */
        secondary: {
          DEFAULT: "#3b82f6",
          container: "#2563eb",
          fixed: "#eff6ff",
          "fixed-dim": "#dbeafe",
        },
        tertiary: {
          fixed: "#86efac",
          "fixed-dim": "#4ade80",
        },
        outline: {
          DEFAULT: "#71717a",
          variant: "#e4e4e7",
        },
        error: {
          DEFAULT: "#dc2626",
          container: "#fecaca",
        },
        slab: {
          accent: "#3b82f6",
          "sidebar-bg": "#f4f4f5",
          /** MCP-style selected row wash */
          "sidebar-active-bg": "rgba(59, 130, 246, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        headline: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        slab: "0px 4px 24px rgba(24, 24, 27, 0.06)",
        "slab-md": "0px 8px 32px rgba(24, 24, 27, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
