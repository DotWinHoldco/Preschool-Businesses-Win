import { ScrollReveal } from './ScrollReveal';

interface ValuePropCardProps {
  title: string;
  body: string;
  index: number;
}

export function ValuePropCard({ title, body, index }: ValuePropCardProps) {
  return (
    <ScrollReveal delay={index * 0.12}>
      <div className="flex gap-4 items-start pb-6 border-b border-gray-100 last:border-b-0">
        <div className="flex-shrink-0 mt-1">
          <svg className="w-8 h-8" viewBox="26.5 36 147 128" fill="#F878AF">
            <path d="M161.6 47.8c-15.8-15.7-41.5-15.7-57.3 0L100 52.1l-4.3-4.3c-15.8-15.7-41.5-15.7-57.3 0-15.8 15.7-15.8 41.1 0 56.7l61.6 61 61.6-61c15.8-15.6 15.8-41 0-56.7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-kollektif text-lg text-[#5CB961] mb-1">{title}</h3>
          <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">{body}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
