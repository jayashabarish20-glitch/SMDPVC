interface SectionHeaderProps {
  title: string;
  description: string;
  badge?: string;
}

export function SectionHeader({ title, description, badge }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      {badge && (
        <span className="inline-block rounded-full bg-school-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-school-gold mb-3">
          {badge}
        </span>
      )}
      <h2 className="font-serif text-3xl font-bold text-school-navy">
        {title}
      </h2>
      <p className="mt-2 text-school-muted">
        {description}
      </p>
    </div>
  );
}
