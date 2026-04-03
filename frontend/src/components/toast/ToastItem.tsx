import { useEffect } from "react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ToastRecord } from "@/stores/useToastStore";
import { useToastStore } from "@/stores/useToastStore";

const iconFilled = { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } as const;

type ToastItemProps = {
  toast: ToastRecord;
};

export function ToastItem({ toast }: ToastItemProps) {
  const dismissToast = useToastStore((s) => s.dismissToast);
  const isSuccess = toast.type === "success";

  useEffect(() => {
    if (toast.durationMs === 0) return;
    const id = window.setTimeout(() => dismissToast(toast.id), toast.durationMs);
    return () => window.clearTimeout(id);
  }, [toast.id, toast.durationMs, dismissToast]);

  return (
    <div
      role="alert"
      className="w-full overflow-hidden rounded-xl bg-white/70 p-1 shadow-[0px_12px_32px_rgba(25,28,30,0.08)] backdrop-blur-xl animate-toast-in"
    >
      <div className="flex rounded-[calc(0.75rem-4px)] border border-outline-variant/15 bg-surface-container-lowest p-4">
        <div className="mr-4 shrink-0">
          <div
            className={
              isSuccess
                ? "flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950"
                : "flex h-10 w-10 items-center justify-center rounded-full bg-error-container"
            }
          >
            <Icon
              name={isSuccess ? "check_circle" : "warning"}
              className={
                isSuccess ? "!text-xl text-tertiary-fixed-dim" : "!text-xl text-error"
              }
              style={iconFilled}
            />
          </div>
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-headline text-base font-bold text-primary">{toast.title}</h4>
            {!isSuccess && toast.tag ? (
              <span className="rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-950">
                {toast.tag}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{toast.message}</p>
          {!isSuccess && toast.actions && toast.actions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {toast.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.onClick?.();
                    dismissToast(toast.id);
                  }}
                  className="text-xs font-bold text-secondary transition-all hover:underline"
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="h-6 shrink-0 text-on-surface-variant transition-colors hover:text-primary"
          aria-label="Dismiss notification"
        >
          <Icon name="close" className="!text-lg" />
        </button>
      </div>
      {isSuccess && toast.durationMs !== 0 ? (
        <div className="h-1 w-full overflow-hidden bg-surface-container-high">
          <div
            className="h-full origin-left bg-tertiary-fixed-dim animate-toast-progress"
            style={
              {
                "--toast-duration-ms": `${toast.durationMs}ms`,
              } as CSSProperties
            }
          />
        </div>
      ) : !isSuccess ? (
        <div className="h-1 w-full bg-error" aria-hidden />
      ) : null}
    </div>
  );
}
