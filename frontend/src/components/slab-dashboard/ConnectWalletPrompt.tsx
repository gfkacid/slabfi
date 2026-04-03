import type { ReactNode } from "react";
import { useAppKit } from "@reown/appkit/react";

const sizeClass = {
  sm: "rounded-lg bg-primary px-4 py-2 text-xs font-headline font-bold text-on-primary shadow-sm hover:opacity-90",
  md: "rounded-xl bg-secondary-container px-4 py-3 text-sm font-headline font-bold text-white shadow-sm hover:bg-secondary",
} as const;

type ConnectWalletPromptProps = {
  className?: string;
  children?: ReactNode;
  size?: keyof typeof sizeClass;
};

export function ConnectWalletPrompt({
  className = "",
  children = "Connect Wallet",
  size = "sm",
}: ConnectWalletPromptProps) {
  const { open } = useAppKit();
  return (
    <button
      type="button"
      onClick={() => void open()}
      className={`inline-flex items-center justify-center transition-all active:scale-[0.98] ${sizeClass[size]} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
