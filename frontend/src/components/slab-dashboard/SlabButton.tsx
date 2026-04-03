import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants = {
  headerWallet:
    "rounded-lg bg-primary px-4 py-2 font-sans text-xs font-semibold text-on-primary hover:bg-primary-container",
  claim:
    "w-full rounded-lg bg-secondary py-2 font-headline text-[11px] font-bold uppercase tracking-wider text-on-primary hover:bg-secondary-container",
  manageLoan:
    "w-full rounded-xl bg-secondary-container py-3 font-bold text-white hover:bg-secondary",
  toolbar: "rounded p-1 px-2 text-xs font-medium transition-colors hover:bg-zinc-200",
  toolbarActive: "rounded bg-zinc-200 p-1 px-2 text-xs font-medium",
  textLink: "text-xs font-bold text-secondary hover:underline",
} as const;

type SlabButtonVariant = keyof typeof variants;

type SlabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: SlabButtonVariant;
};

export function SlabButton({
  variant,
  className = "",
  type = "button",
  ...rest
}: SlabButtonProps) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`.trim()} {...rest} />
  );
}
