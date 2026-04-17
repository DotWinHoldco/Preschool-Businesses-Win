import { ScrollReveal } from './ScrollReveal';

const ACCENT_COLORS = ['border-l-cca-green', 'border-l-cca-blue', 'border-l-cca-coral', 'border-l-cca-yellow'];

interface FeatureRowProps {
  title: string;
  body: string;
  imageSrc?: string;
  reversed?: boolean;
  index: number;
}

export function FeatureRow({ title, body, index }: FeatureRowProps) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <ScrollReveal delay={index * 0.1}>
      <div className={`border-l-4 ${accent} pl-8 py-8`}>
        <div className="flex items-baseline gap-4 mb-3">
          <span className="font-kollektif text-4xl text-cca-ink/15">{String(index + 1).padStart(2, '0')}</span>
          <h3 className="font-kollektif text-xl md:text-2xl text-cca-ink">{title}</h3>
        </div>
        <p className="font-questrial text-cca-ink/80 text-base md:text-lg leading-relaxed">{body}</p>
      </div>
    </ScrollReveal>
  );
}
