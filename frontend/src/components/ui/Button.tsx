import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "ghost" | "subtle";

export const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary px-5 py-2 text-xs text-on-primary hover:bg-primary-container",
  accent:
    "bg-secondary-container px-5 py-3 text-sm font-bold text-white hover:bg-secondary rounded-xl",
  ghost: "p-2 text-on-surface hover:text-slab-accent",
  subtle:
    "rounded-xl bg-surface-container-high p-4 text-left text-sm hover:bg-secondary-fixed/40",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  const cls = `${base} ${buttonVariantClass[variant]} ${className}`.trim();
  return <button type={type} className={cls} {...rest} />;
}

type LinkButtonProps = {
  to: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

export function LinkButton({
  to,
  variant = "primary",
  className = "",
  children,
}: LinkButtonProps) {
  const cls = `${base} ${buttonVariantClass[variant]} ${className}`.trim();
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}
