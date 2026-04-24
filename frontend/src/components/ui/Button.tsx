import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary px-5 py-2 text-xs text-on-primary hover:bg-primary-container",
        accent:
          "rounded-xl bg-secondary-container px-5 py-3 text-sm font-bold text-white hover:bg-secondary",
        ghost: "p-2 text-on-surface hover:text-slab-accent",
        subtle:
          "rounded-xl bg-surface-container-high p-4 text-left text-sm hover:bg-secondary-fixed/40",
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
