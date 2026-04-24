import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-[8px] bg-brand-gradient px-5 py-2 text-xs font-extrabold uppercase tracking-wide text-background shadow-icon hover:brightness-110",
        accent:
          "rounded-[100px] bg-surface/10 px-5 py-2 text-xs font-medium text-text-primary shadow-card hover:bg-surface/15",
        ghost: "rounded-[8px] p-2 text-text-primary/70 hover:bg-surface/10 hover:text-text-primary",
        subtle:
          "rounded-[15px] bg-surface/10 p-4 text-left text-sm text-text-primary hover:bg-surface/15",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  variant,
  className,
  type = "button",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}

type LinkButtonProps = {
  to: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  className?: string;
  children: ReactNode;
};

export function LinkButton({ to, variant, className, children }: LinkButtonProps) {
  return (
    <Link to={to} className={cn(buttonVariants({ variant }), className)}>
      {children}
    </Link>
  );
}
