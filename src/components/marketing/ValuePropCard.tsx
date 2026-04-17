import { ScrollReveal } from './ScrollReveal';

interface ValuePropCardProps {
  title: string;
  body: string;
  index: number;
}

export function ValuePropCard({ title, body, index }: ValuePropCardProps) {
  return (
    <ScrollReveal delay={index * 0.12}>
      <div className="flex gap-4 items-start p-4 border-b border-gray-100 last:border-b-0">
        <div className="flex-shrink-0 mt-1">
          <svg className="w-8 h-8" viewBox="26.5 36.011 147 127.998" fill="#F878AF">
            <path d="M161.646 47.804l-.035-.035-.002-.002c-15.816-15.672-41.455-15.672-57.271 0l-4.338 4.3-4.338-4.3c-15.816-15.672-41.455-15.672-57.271 0-15.817 15.671-15.817 41.079 0 56.75l.035.036.002.002 61.572 61.034 61.572-61.034.002-.002.035-.036c15.817-15.671 15.817-41.079.037-56.713z" />
          </svg>
        </div>
        <div>
          <h3 className="font-kollektif text-lg text-cca-ink mb-1">{title}</h3>
          <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">{body}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
