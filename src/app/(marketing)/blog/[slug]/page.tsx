import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { createServerClientWithoutTenant as createClient } from '@/lib/supabase/server';

const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_path, meta_title, meta_description')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt,
    openGraph: {
      title: post.meta_title ?? post.title,
      description: post.meta_description ?? post.excerpt,
      images: post.cover_path ? [{ url: post.cover_path }] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) notFound();

  const formattedDate = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <section className="py-16 px-6 bg-cca-cream">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <Link href="/blog" className="font-questrial text-sm text-cca-blue hover:underline mb-4 inline-block">
              &larr; Back to Blog
            </Link>
            <h1 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-cca-ink/50 font-questrial">
              <span>{post.author ?? 'Crandall Christian Academy'}</span>
              <span>&middot;</span>
              <span>{formattedDate}</span>
              {post.read_time_minutes && (
                <>
                  <span>&middot;</span>
                  <span>{post.read_time_minutes} min read</span>
                </>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {post.cover_path && (
        <div className="max-w-4xl mx-auto px-6 -mt-4 mb-8">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={post.cover_path}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        </div>
      )}

      <article className="py-12 px-6">
        <div
          className="max-w-3xl mx-auto prose prose-lg prose-gray font-questrial prose-headings:font-kollektif prose-a:text-cca-blue"
          dangerouslySetInnerHTML={{ __html: post.body_html ?? '' }}
        />
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            author: {
              '@type': 'Organization',
              name: post.author ?? 'Crandall Christian Academy',
            },
            datePublished: post.published_at,
            image: post.cover_path,
            publisher: {
              '@type': 'Organization',
              name: 'Crandall Christian Academy',
              logo: { '@type': 'ImageObject', url: 'https://crandallchristianacademy.com/marketing/shared/cca-logo-full.png' },
            },
          }),
        }}
      />
    </>
  );
}
