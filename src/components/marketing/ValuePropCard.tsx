import { ScrollReveal } from './ScrollReveal';

interface ValuePropCardProps {
  title: string;
  body: string;
  index: number;
}

export function ValuePropCard({ title, body, index }: ValuePropCardProps) {
  return (
    <ScrollReveal delay={index * 0.12}>
      <div className="text-center p-6 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 hover:-translate-y-1 hover:bg-white/25 transition-all duration-300">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-white/20">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <h3 className="font-kollektif text-lg mb-2 text-white">{title}</h3>
        <p className="font-questrial text-white/85 text-base leading-relaxed">{body}</p>
      </div>
    </ScrollReveal>
  );
}
