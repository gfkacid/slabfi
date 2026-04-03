export const LIQUIDATION_DELAY_SEC = 6 * 60 * 60;
/** Liquidator pays debt × (1 - 15% bonus) per current app economics */
export const LIQUIDATOR_PAYMENT_BPS = 10000 - 1500;

/** Table + mock queue — opens bid modal; not tied to wagmi pending (that stays in the modal). */
export const LIQUIDATION_BID_BUTTON_CLASS =
  "rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-on-secondary shadow-md transition-all hover:bg-secondary-container hover:shadow-lg active:scale-[0.98]";
