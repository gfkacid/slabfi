import { create } from "zustand";

export type ToastVariant = "success" | "error";

export type ToastAction = {
  label: string;
  onClick?: () => void;
};

export type ToastInput = {
  type: ToastVariant;
  /** Defaults: success → "Success", error → "Error" */
  title?: string;
  message: string;
  /** Auto-dismiss delay in ms. `0` = no auto-dismiss. Defaults: success 4500, error 8000. */
  durationMs?: number;
  /** Shown as a small pill on error toasts (e.g. "Gas Error"). */
  tag?: string;
  /** Optional actions (e.g. Try again, View details). */
  actions?: ToastAction[];
};

export type ToastRecord = {
  id: string;
  createdAt: number;
  type: ToastVariant;
  title: string;
  message: string;
  durationMs: number;
  tag?: string;
  actions?: ToastAction[];
};

type ToastState = {
  toasts: ToastRecord[];
  showToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
};

let idCounter = 0;

function nextId() {
  return `toast-${++idCounter}-${Date.now()}`;
}

function withDefaults(input: ToastInput): ToastRecord {
  const title =
    input.title ??
    (input.type === "success" ? "Success" : "Error");
  const durationMs =
    input.durationMs !== undefined
      ? input.durationMs
      : input.type === "success"
        ? 4500
        : 8000;
  return {
    ...input,
    id: nextId(),
    createdAt: Date.now(),
    title,
    durationMs,
  };
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (input) => {
    const record = withDefaults(input);
    set((s) => ({ toasts: [record, ...s.toasts] }));
    return record.id;
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative API — use from handlers, effects, or non-React code. */
export function showToast(input: ToastInput): string {
  return useToastStore.getState().showToast(input);
}

export function dismissToast(id: string): void {
  useToastStore.getState().dismissToast(id);
}
