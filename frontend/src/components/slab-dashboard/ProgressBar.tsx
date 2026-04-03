type ProgressBarProps = {
  valuePercent: number;
  fillClassName: string;
  trackClassName?: string;
  height?: "sm" | "md";
};

const heightClass = { sm: "h-1.5", md: "h-2" } as const;

export function ProgressBar({
  valuePercent,
  fillClassName,
  trackClassName = "w-full overflow-hidden rounded-full bg-zinc-300/70",
  height = "sm",
}: ProgressBarProps) {
  const w = `${Math.min(100, Math.max(0, valuePercent))}%`;
  return (
    <div className={`${trackClassName} ${heightClass[height]}`}>
      <div className={`h-full rounded-full ${fillClassName}`.trim()} style={{ width: w }} />
    </div>
  );
}
