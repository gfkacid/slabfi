import type { HTMLAttributes } from "react";

type IconProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
};

export function Icon({ name, className = "", ...rest }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} {...rest}>
      {name}
    </span>
  );
}
