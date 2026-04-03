/**
 * Global toast API — use from event handlers, TanStack Query callbacks, or forms.
 *
 * @example API success
 * ```ts
 * showToast({
 *   type: "success",
 *   title: "Transaction confirmed",
 *   message: "Your deposit was submitted successfully.",
 * });
 * ```
 *
 * @example API / wallet error
 * ```ts
 * showToast({
 *   type: "error",
 *   title: "Transaction failed",
 *   message: err instanceof Error ? err.message : "Request failed.",
 *   tag: "Wallet",
 *   actions: [{ label: "Try again", onClick: () => retry() }],
 * });
 * ```
 *
 * @example Form submission
 * ```ts
 * const onSubmit = async () => {
 *   try {
 *     await save();
 *     showToast({ type: "success", message: "Profile saved." });
 *   } catch {
 *     showToast({ type: "error", message: "Could not save. Check fields and retry." });
 *   }
 * };
 * ```
 */
export { showToast, dismissToast, useToastStore } from "@/stores/useToastStore";
export type {
  ToastInput,
  ToastRecord,
  ToastVariant,
  ToastAction,
} from "@/stores/useToastStore";
