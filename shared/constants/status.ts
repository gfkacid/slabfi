/** Human-readable labels for collateral status (uint8 on-chain) */
export const COLLATERAL_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Active",
  2: "Unlocking",
  3: "Released",
};

/** Tailwind classes for collateral status badges */
export const COLLATERAL_STATUS_BADGE_CLASSES: Record<number, string> = {
  0: "bg-slate-100 text-slate-600 border-slate-200",
  1: "bg-emerald-100 text-emerald-800 border-emerald-200",
  2: "bg-amber-100 text-amber-800 border-amber-200",
  3: "bg-slate-100 text-slate-500 border-slate-200",
};

/** Human-readable labels for position / health factor status */
export const POSITION_STATUS_LABELS: Record<number, string> = {
  0: "Healthy",
  1: "Warning",
  2: "Liquidatable",
  3: "Closed",
};

export const POSITION_STATUS_BADGE_CLASSES: Record<number, string> = {
  0: "bg-emerald-100 text-emerald-800 border-emerald-200",
  1: "bg-amber-100 text-amber-800 border-amber-200",
  2: "bg-red-100 text-red-800 border-red-200",
  3: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Max token id scanned when listing Slab.Finance demo collectibles */
export const MAX_TOKEN_ID = 100;

/**
 * When an ERC-721 is not enumerable, `ownerOf` is probed for ids `1..N` (RPC-heavy).
 * Override in the browser with `VITE_EVM_LOCK_OWNER_SCAN_MAX`.
 */
export const MAX_OWNER_SCAN_TOKEN_ID_DEFAULT = 2000;
