import type { HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "muted" | "inverse";

const variantClass: Record<CardVariant, string> = {
  default:
    "rounded-xl border border-outline-variant/10 bg-white shadow-slab",
  elevated:
    "rounded-xl border border-outline-variant/5 bg-white p-6 shadow-sm",
  muted: "rounded-xl bg-surface-container-lowest p-6 shadow-slab",
  inverse: "rounded-2xl bg-primary p-6 text-white shadow-xl",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ variant = "default", className = "", children, ...rest }: CardProps) {
  return (
    <div className={`${variantClass[variant]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
