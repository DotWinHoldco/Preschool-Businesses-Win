import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  coverPath: string;
  publishedAt: string;
  readTimeMinutes: number;
  index: number;
}

export function BlogCard({ slug, title, excerpt, coverPath, publishedAt, readTimeMinutes, index }: BlogCardProps) {
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ScrollReveal delay={index * 0.06}>
      <Link href={`/blog/${slug}`} className="group block">
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={coverPath}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-kollektif text-lg mb-2 group-hover:text-cca-blue transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="font-questrial text-sm text-cca-ink/70 line-clamp-2 flex-1">{excerpt}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-cca-ink/50 font-questrial">
              <span>{formattedDate}</span>
              <span>·</span>
              <span>{readTimeMinutes} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}
