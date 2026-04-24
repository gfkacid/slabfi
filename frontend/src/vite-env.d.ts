/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** If true, run UI in "demo" mode: no wallet/network required. */
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  /** Nest read API (includes card valuations at /cards/.../valuation). e.g. http://localhost:3001 */
  readonly VITE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
