interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowColor?: string;
  heading: string;
  headingColor?: string;
  subheading?: string;
  centered?: boolean;
}

export function SectionHeader({
  eyebrow,
  eyebrowColor = 'text-cca-pink',
  heading,
  headingColor = 'text-cca-ink',
  subheading,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      {eyebrow && (
        <p className={`font-coming-soon text-sm uppercase tracking-wider mb-2 ${eyebrowColor}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`font-kollektif text-3xl md:text-[3.544rem] md:leading-[1.3] ${headingColor}`}>
        {heading}
      </h2>
      {subheading && (
        <p className="font-questrial text-lg text-cca-ink/70 mt-4 max-w-2xl mx-auto">
          {subheading}
        </p>
      )}
    </div>
  );
}
