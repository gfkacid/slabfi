import type { ReactNode } from "react";
import { lendingGhostBorder } from "@/components/shared/lending/lendingStyles";

const USDC_IMG = "/usd-coin-usdc-logo.png";

type UsdcInputFieldProps = {
  label: string;
  headerRight?: ReactNode;
  placeholder?: string;
  tokenClassName?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export function UsdcInputField({
  label,
  headerRight,
  placeholder = "0.00",
  tokenClassName = "",
  value,
  onChange,
}: UsdcInputFieldProps) {
  return (
    <div
      className={`rounded-xl bg-white p-6 transition-[border-color,box-shadow] ${lendingGhostBorder} focus-within:border-secondary/50 focus-within:ring-2 focus-within:ring-secondary/15`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </label>
        {headerRight}
      </div>
      <div className="flex items-center gap-4">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent font-headline text-3xl font-bold text-primary outline-none focus:ring-0"
          placeholder={placeholder}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
        <div
          className={`flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm ${lendingGhostBorder} ${tokenClassName}`.trim()}
        >
          <img alt="USDC" className="h-6 w-6 rounded-full" src={USDC_IMG} />
          <span className="font-bold text-primary">USDC</span>
        </div>
      </div>
    </div>
  );
}
