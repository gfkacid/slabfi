type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, description, className = "" }: PageHeaderProps) {
  return (
    <header className={`mb-8 ${className}`.trim()}>
      <h1 className="font-headline text-2xl font-extrabold text-primary">{title}</h1>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{description}</p>
      ) : null}
    </header>
  );
}
