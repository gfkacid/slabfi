export type SummaryHeaderProps = {
  title: string;
  welcomeLine: string;
};

export function SummaryHeader({ title, welcomeLine }: SummaryHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="font-headline text-2xl font-extrabold text-primary">{title}</h1>
      <p className="text-xs font-medium text-on-surface-variant">{welcomeLine}</p>
    </header>
  );
}
