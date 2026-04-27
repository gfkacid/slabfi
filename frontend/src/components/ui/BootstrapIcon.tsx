import type { HTMLAttributes } from "react";

import bank from "bootstrap-icons/icons/bank.svg?url";
import boxArrowLeft from "bootstrap-icons/icons/box-arrow-left.svg?url";
import currencyDollar from "bootstrap-icons/icons/currency-dollar.svg?url";
import exclamationTriangle from "bootstrap-icons/icons/exclamation-triangle.svg?url";
import filePost from "bootstrap-icons/icons/file-post.svg?url";
import filePostFill from "bootstrap-icons/icons/file-post-fill.svg?url";
import gear from "bootstrap-icons/icons/gear.svg?url";
import grid from "bootstrap-icons/icons/grid.svg?url";
import gridFill from "bootstrap-icons/icons/grid-fill.svg?url";
import questionCircle from "bootstrap-icons/icons/question-circle.svg?url";
import wallet2 from "bootstrap-icons/icons/wallet2.svg?url";

import { cn } from "@/lib/utils";

export type BootstrapIconName =
  | "bank"
  | "box-arrow-left"
  | "currency-dollar"
  | "exclamation-triangle"
  | "file-post"
  | "file-post-fill"
  | "gear"
  | "grid"
  | "grid-fill"
  | "question-circle"
  | "wallet2";

const ICON_URLS: Record<BootstrapIconName, string> = {
  bank,
  "box-arrow-left": boxArrowLeft,
  "currency-dollar": currencyDollar,
  "exclamation-triangle": exclamationTriangle,
  "file-post": filePost,
  "file-post-fill": filePostFill,
  gear,
  grid,
  "grid-fill": gridFill,
  "question-circle": questionCircle,
  wallet2,
};

export type BootstrapIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: BootstrapIconName;
  /**
   * When true, fills the masked SVG with the brand gradient.
   * Otherwise uses a solid fill via `colorClassName` (defaults to `bg-current`).
   */
  gradient?: boolean;
  /** Applies when `gradient` is false. Defaults to `bg-current` */
  colorClassName?: string;
};

export function BootstrapIcon({
  name,
  gradient = false,
  colorClassName = "bg-current",
  className,
  style,
  ...rest
}: BootstrapIconProps) {
  const url = ICON_URLS[name];

  return (
    <span
      className={cn("block", gradient ? "" : colorClassName, className)}
      style={{
        ...(style || {}),
        backgroundImage: gradient ? "var(--gradient-brand)" : undefined,
        WebkitMaskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        maskImage: `url(${url})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export type MaskedSvgIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  url: string;
  gradient?: boolean;
  colorClassName?: string;
};

export function MaskedSvgIcon({
  url,
  gradient = false,
  colorClassName = "bg-current",
  className,
  style,
  ...rest
}: MaskedSvgIconProps) {
  return (
    <span
      className={cn("block", gradient ? "" : colorClassName, className)}
      style={{
        ...(style || {}),
        backgroundImage: gradient ? "var(--gradient-brand)" : undefined,
        WebkitMaskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        maskImage: `url(${url})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

