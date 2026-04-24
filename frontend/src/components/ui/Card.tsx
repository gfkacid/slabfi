import type { HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "muted" | "inverse";

const variantClass: Record<CardVariant, string> = {
  default:
    "rounded-[20px] border border-border/20 bg-surface/0 shadow-card",
  elevated:
    "rounded-[20px] border border-border/20 bg-surface/0 p-6 shadow-card",
  muted: "rounded-xl bg-surface-container-lowest p-6 shadow-slab",
  inverse: "rounded-[20px] border border-border/20 bg-background p-6 text-text-primary shadow-card",
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
