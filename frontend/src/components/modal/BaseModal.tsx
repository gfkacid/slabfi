import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Extra classes for the inner panel (width, etc.) */
  panelClassName?: string;
  /** Classes for the scrollable body below the header */
  bodyClassName?: string;
};

export function BaseModal({
  open,
  onClose,
  title,
  children,
  panelClassName = "max-w-lg",
  bodyClassName = "p-8",
}: BaseModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const root = panelRef.current;
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    const list = focusables();
    const first = list[0];
    const bidInput = root.querySelector<HTMLInputElement>('input[inputmode="decimal"]');
    (bidInput ?? first)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const i = nodes.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (i <= 0) {
          e.preventDefault();
          nodes[nodes.length - 1]?.focus();
        }
      } else if (i === -1 || i === nodes.length - 1) {
        e.preventDefault();
        nodes[0]?.focus();
      }
    };
    root.addEventListener("keydown", onKeyDown as unknown as EventListener);
    return () => root.removeEventListener("keydown", onKeyDown as unknown as EventListener);
  }, [open]);

  useEffect(() => {
    if (open) return;
    previouslyFocused.current?.focus?.();
  }, [open]);

  const onOverlayPointerDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onOverlayPointerDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-white shadow-2xl transition-all duration-200 ease-out ${panelClassName} ${
          entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-[0.98] opacity-0"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h3
            id="modal-title"
            className="font-headline text-xl font-extrabold tracking-tight text-primary"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant transition-colors hover:text-primary"
            aria-label="Close"
          >
            <Icon name="close" className="text-2xl" />
          </button>
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
