import { ScrollReveal } from './ScrollReveal';

interface ValuePropCardProps {
  title: string;
  body: string;
  iconColor?: string;
  index: number;
}

export function ValuePropCard({ title, body, iconColor = 'text-cca-pink', index }: ValuePropCardProps) {
  return (
    <ScrollReveal delay={index * 0.12}>
      <div className="text-center p-6">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${iconColor} bg-current/10`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <h3 className="font-kollektif text-lg mb-2">{title}</h3>
        <p className="font-questrial text-cca-ink/80 text-base leading-relaxed">{body}</p>
      </div>
    </ScrollReveal>
  );
}
