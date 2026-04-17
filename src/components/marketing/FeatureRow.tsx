import Image from 'next/image';
import { ScrollReveal } from './ScrollReveal';

interface FeatureRowProps {
  title: string;
  body: string;
  imageSrc?: string;
  reversed?: boolean;
  index: number;
}

export function FeatureRow({ title, body, imageSrc, reversed = false, index }: FeatureRowProps) {
  return (
    <ScrollReveal delay={index * 0.1}>
      <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 py-12 ${reversed ? 'md:flex-row-reverse' : ''}`}>
        {imageSrc && (
          <div className="w-full md:w-1/2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image src={imageSrc} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        )}
        <div className={`w-full ${imageSrc ? 'md:w-1/2' : ''}`}>
          <h3 className="font-kollektif text-2xl mb-4 text-cca-blue">{title}</h3>
          <p className="font-questrial text-cca-ink/80 text-lg leading-relaxed">{body}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
