import Image from 'next/image';
import { ScrollReveal } from './ScrollReveal';

interface PillarCardProps {
  title: string;
  body: string;
  imageSrc: string;
  accentColor: string;
  index: number;
}

export function PillarCard({ title, body, imageSrc, accentColor, index }: PillarCardProps) {
  return (
    <ScrollReveal delay={index * 0.1}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${accentColor}`} />
        </div>
        <div className="p-6">
          <h3 className="font-kollektif text-xl mb-3">{title}</h3>
          <p className="font-questrial text-cca-ink/80 text-base leading-relaxed">{body}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
