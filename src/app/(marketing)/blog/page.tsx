import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { BlogCard } from '@/components/marketing/BlogCard';
import { createServerClientWithoutTenant as createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest articles from Crandall Christian Academy about early childhood education, parenting tips, and faith-based learning.',
};

const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';
const POSTS_PER_PAGE = 12;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const offset = (page - 1) * POSTS_PER_PAGE;

  const supabase = await createClient();
  const { data: posts, count } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, cover_path, published_at, read_time_minutes', { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1);

  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE);

  return (
    <>
      <section className="py-24 px-6 bg-cca-cream">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink mb-4">Blog</h1>
            <p className="font-questrial text-lg text-cca-ink/70">
              Insights on early childhood education, parenting, and faith-based learning.
            </p>
          </ScrollReveal>
        </div>
      </section>
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {posts && posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, i) => (
                  <BlogCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt ?? ''}
                    coverPath={post.cover_path ?? '/marketing/shared/cca-logo-full.png'}
                    publishedAt={post.published_at}
                    readTimeMinutes={post.read_time_minutes ?? 3}
                    index={i}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`/blog?page=${p}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-full font-questrial text-sm transition-colors ${
                        p === page
                          ? 'bg-cca-blue text-white'
                          : 'bg-gray-100 text-cca-ink hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <ScrollReveal>
              <div className="text-center py-12">
                <p className="font-questrial text-lg text-cca-ink/60">
                  Blog posts are coming soon. Check back for updates!
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </>
  );
}
