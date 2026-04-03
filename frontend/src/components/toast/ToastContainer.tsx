import { useToastStore } from "@/stores/useToastStore";
import { ToastItem } from "@/components/toast/ToastItem";

/**
 * Global toast host — bottom-right stack (`flex-col-reverse` so newest sits nearest the bottom edge).
 * `bottom-20` clears the mobile tab bar; `md:bottom-8` on larger viewports.
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-20 left-4 right-4 z-[100] mx-auto flex max-w-md flex-col-reverse gap-4 md:bottom-8 md:left-auto md:right-8 md:mx-0 md:ml-auto"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
