import type { ReactNode } from "react";
import { lendingGhostBorder } from "@/components/shared/lending/lendingStyles";

const USDC_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCbXzAA1ULF8c1TKRmR9w6Oox8Jy1L1LfI0umXj407TWK874_IPR5Wf8mI50iRvIcm_7FQljTDH2gTRTTWSumyWji8bG2i9i_zYL1uhL4euLQckiwN2xACauLKLMGAU67H7vAzmeI0Te3EJlZkkrEhDAMIIe17Lhc76D3_o9uKe1cD5k8SIq4p6Ulnmax_Hq3nhopBeaPeTBV0uqpFFpDkMuxZ5E9QSonxsriT9w0zmktLOUpE5oo-ba3MU59ppGOp4r591xFUtGbM";

type UsdcInputFieldProps = {
  label: string;
  headerRight?: ReactNode;
  placeholder?: string;
  tokenClassName?: string;
};

export function UsdcInputField({
  label,
  headerRight,
  placeholder = "0.00",
  tokenClassName = "",
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
        />
        <div
          className={`flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm ${lendingGhostBorder} ${tokenClassName}`.trim()}
        >
          <img alt="" className="h-6 w-6 rounded-full" src={USDC_IMG} />
          <span className="font-bold text-primary">USDC</span>
        </div>
      </div>
    </div>
  );
}
