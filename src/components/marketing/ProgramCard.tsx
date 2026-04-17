import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

interface ProgramCardProps {
  slug: string;
  title: string;
  body: string;
  imageSrc: string;
  applyUrl: string;
  index: number;
}

export function ProgramCard({ slug, title, body, imageSrc, applyUrl, index }: ProgramCardProps) {
  return (
    <ScrollReveal delay={index * 0.1}>
      <div id={slug} className="scroll-mt-24">
        <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 py-12 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
          <div className="w-full md:w-1/2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h3 className="font-kollektif text-2xl md:text-3xl mb-4 text-cca-blue">{title}</h3>
            <p className="font-questrial text-cca-ink/80 text-lg leading-relaxed mb-6">{body}</p>
            <Link
              href={applyUrl}
              className="inline-block bg-cca-green text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-green/90 transition-colors"
            >
              Apply Now!
            </Link>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
