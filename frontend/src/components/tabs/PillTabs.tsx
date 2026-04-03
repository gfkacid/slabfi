export type PillTabItem<T extends string> = {
  id: T;
  label: string;
};

type PillTabsProps<T extends string> = {
  tabs: readonly PillTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  /** Defaults preserve lending-hub behavior. */
  ariaLabel?: string;
  idPrefix?: string;
};

export function PillTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  className = "",
  ariaLabel = "Lending actions",
  idPrefix = "lending",
}: PillTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex gap-1 rounded-xl bg-surface-container-low p-1.5 ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`${idPrefix}-tab-${tab.id}`}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={
              selected
                ? "rounded-lg bg-white px-6 py-2 text-sm font-bold text-primary shadow-sm"
                : "rounded-lg px-6 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
