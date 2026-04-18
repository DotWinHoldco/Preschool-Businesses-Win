import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

interface PillarCardProps {
  title: string;
  body: string;
  imageSrc: string;
  accentColor: string;
  index: number;
}

export function PillarCard({ title, body, imageSrc, index }: PillarCardProps) {
  return (
    <ScrollReveal delay={index * 0.1}>
      <div className="flex flex-col items-center text-center">
        <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden mb-6 shadow-lg ring-4 ring-white">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 160px, 192px"
          />
        </div>
        <h3 className="font-kollektif text-xl mb-3 text-cca-blue">{title}</h3>
        <p className="font-questrial text-cca-ink/80 text-sm leading-relaxed">{body}</p>
        <Link href="/about" className="text-cca-blue font-kollektif text-sm hover:underline mt-3 inline-block">
          Read More
        </Link>
      </div>
    </ScrollReveal>
  );
}
