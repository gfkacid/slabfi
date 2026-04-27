import type { HTMLAttributes } from "react";

import bank from "bootstrap-icons/icons/bank.svg?url";
import award from "bootstrap-icons/icons/award.svg?url";
import arrowUpRightCircle from "bootstrap-icons/icons/arrow-up-right-circle.svg?url";
import boxArrowLeft from "bootstrap-icons/icons/box-arrow-left.svg?url";
import currencyDollar from "bootstrap-icons/icons/currency-dollar.svg?url";
import exclamationTriangle from "bootstrap-icons/icons/exclamation-triangle.svg?url";
import filePost from "bootstrap-icons/icons/file-post.svg?url";
import filePostFill from "bootstrap-icons/icons/file-post-fill.svg?url";
import graphUpArrow from "bootstrap-icons/icons/graph-up-arrow.svg?url";
import gear from "bootstrap-icons/icons/gear.svg?url";
import globe2 from "bootstrap-icons/icons/globe2.svg?url";
import grid from "bootstrap-icons/icons/grid.svg?url";
import gridFill from "bootstrap-icons/icons/grid-fill.svg?url";
import heart from "bootstrap-icons/icons/heart.svg?url";
import infoCircle from "bootstrap-icons/icons/info-circle.svg?url";
import list from "bootstrap-icons/icons/list.svg?url";
import patchCheck from "bootstrap-icons/icons/patch-check.svg?url";
import questionCircle from "bootstrap-icons/icons/question-circle.svg?url";
import search from "bootstrap-icons/icons/search.svg?url";
import sliders2Vertical from "bootstrap-icons/icons/sliders2-vertical.svg?url";
import starFill from "bootstrap-icons/icons/star-fill.svg?url";
import trophy from "bootstrap-icons/icons/trophy.svg?url";
import wallet2 from "bootstrap-icons/icons/wallet2.svg?url";
import xDiamond from "bootstrap-icons/icons/x-diamond.svg?url";

import { cn } from "@/lib/utils";

export type BootstrapIconName =
  | "award"
  | "arrow-up-right-circle"
  | "bank"
  | "box-arrow-left"
  | "currency-dollar"
  | "exclamation-triangle"
  | "file-post"
  | "file-post-fill"
  | "graph-up-arrow"
  | "gear"
  | "globe2"
  | "grid"
  | "grid-fill"
  | "heart"
  | "info-circle"
  | "list"
  | "patch-check"
  | "question-circle"
  | "search"
  | "sliders2-vertical"
  | "star-fill"
  | "trophy"
  | "wallet2"
  | "x-diamond";

const ICON_URLS: Record<BootstrapIconName, string> = {
  award,
  "arrow-up-right-circle": arrowUpRightCircle,
  bank,
  "box-arrow-left": boxArrowLeft,
  "currency-dollar": currencyDollar,
  "exclamation-triangle": exclamationTriangle,
  "file-post": filePost,
  "file-post-fill": filePostFill,
  "graph-up-arrow": graphUpArrow,
  gear,
  globe2,
  grid,
  "grid-fill": gridFill,
  heart,
  "info-circle": infoCircle,
  list,
  "patch-check": patchCheck,
  "question-circle": questionCircle,
  search,
  "sliders2-vertical": sliders2Vertical,
  "star-fill": starFill,
  trophy,
  wallet2,
  "x-diamond": xDiamond,
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

