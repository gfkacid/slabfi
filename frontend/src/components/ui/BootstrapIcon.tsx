import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BootstrapIconProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  name: string; // e.g. "grid-fill" -> renders "bi bi-grid-fill"
};

export function BootstrapIcon({ name, className, ...rest }: BootstrapIconProps) {
  return <i className={cn("bi", `bi-${name}`, className)} aria-hidden="true" {...rest} />;
}

