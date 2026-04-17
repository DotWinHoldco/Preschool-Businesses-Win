import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

interface CurriculumCardProps {
  age: string;
  body: string;
  imageSrc?: string;
  slug: string;
  applyUrl: string;
  index: number;
}

export function CurriculumCard({ age, body, imageSrc, slug, applyUrl, index }: CurriculumCardProps) {
  return (
    <ScrollReveal delay={index * 0.08}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        {imageSrc && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={imageSrc}
              alt={`${age} program`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-kollektif text-xl mb-3 text-cca-blue">{age}</h3>
          <p className="font-questrial text-cca-ink/80 text-base leading-relaxed flex-1">{body}</p>
          <div className="flex gap-3 mt-4">
            <Link
              href={`/about#${slug}`}
              className="text-sm font-medium text-cca-blue hover:underline"
            >
              Learn More
            </Link>
            <Link
              href={applyUrl}
              className="text-sm font-medium text-white bg-cca-green px-4 py-2 rounded-full hover:bg-cca-green/90 transition-colors"
            >
              Apply Now!
            </Link>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
