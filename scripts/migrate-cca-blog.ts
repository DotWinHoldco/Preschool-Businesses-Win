// Usage: npx tsx scripts/migrate-cca-blog.ts
//
// Scrapes all CCA blog posts from the Wix site, downloads cover images,
// and upserts them into the blog_posts table.

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';
const BASE_URL = 'https://www.crandallchristianacademy.com/post';
const COVER_DIR = path.join(process.cwd(), 'public/cca-assets/marketing/blog');

const SLUGS = [
  'free-activities-for-kids-in-dallas-this-spring',
  '5-fun-springtime-activities-for-preschoolers',
  'crandall-christian-academy-opening-august-2025',
  'the-role-of-play-in-child-development-1',
  '10-creative-ways-to-display-your-child-s-artwork-and-why-it-s-important',
  'the-importance-of-early-childhood-education',
  'how-to-teach-gratitude-to-young-children-and-why-it-s-important',
  'innovative-parenting-strategies-for-high-energy-families-how-crandall-christian-academy-can-help',
  'building-a-foundation-the-impact-of-early-childhood-education',
  'teaching-christian-values-through-early-education',
  '7-bible-verses-every-preschooler-should-learn',
  'the-importance-of-early-childhood-education-for-future-success',
  'how-faith-and-education-go-hand-in-hand',
  '10-best-books-for-preschoolers-educational-and-faith-based-favorites',
  'tips-for-preparing-your-family-for-preschool',
  'the-benefits-of-storytelling-for-early-learners',
  '5-questions-to-ask-when-touring-a-preschool',
  'how-to-choose-the-right-preschool-for-your-child-1',
  'the-benefits-of-faith-based-early-learning-programs',
  '5-fun-outdoor-activities-for-preschool-aged-kids',
  'how-to-choose-the-right-preschool-for-your-child',
  'how-to-create-a-routine-that-works-for-your-family',
  'preparing-your-child-emotionally-for-preschool',
  'preparing-the-next-generation-with-faith-based-learning',
  'storytelling-in-early-childhood-development-unleashing-imagination-and-learning',
  'tips-for-building-a-strong-parent-child-bond',
  'why-play-is-an-essential-part-of-learning',
  'how-our-values-shape-the-future-of-education-at-crandall-christian-academy',
  'how-to-prepare-your-child-for-their-first-day-of-preschool',
  'how-to-encourage-curiosity-and-learning-at-home',
  'the-mission-of-crandall-christian-academy',
  'navigating-the-playful-energy-strategies-for-managing-high-energy-kids',
  'the-role-of-preschool-in-a-child-s-social-development',
  'bible-stories-that-inspire-preschoolers',
  'why-crandall-needs-a-christian-preschool',
  'fun-learning-activities-you-can-do-at-home-with-your-preschooler',
  'preparing-your-home-for-crandall-preschool-creating-a-sensory-friendly-environment-for-your-prescho',
  'understanding-the-needs-of-preschool-aged-children',
  'what-sets-crandall-christian-academy-apart',
  'the-symphony-of-sensory-play-in-early-childhood-education',
  'the-symphony-of-learning-and-imagination-understanding-the-symbiosis-between-learning-and-creative',
  'the-role-of-play-in-child-development',
  'the-benefits-of-a-christian-preschool-environment-a-look-inside-crandall-christian-academy',
  '5-essential-tips-for-choosing-the-right-private-preschool-for-your-child',
  'preparing-your-toddler-for-preschool-a-parent-s-guide',
  'preparing-your-preschooler-for-preschool-a-guide-from-crandall-christian-academy',
  'choosing-the-right-childcare-center-for-your-family-insights-from-crandall-christian-academy',
  'nurturing-early-learners-a-comprehensive-guide-for-future-parents-of-crandall-christian-academy',
  'nourishing-young-minds-the-tapestry-of-early-childhood-education',
  'building-emotional-intelligence-in-preschoolers-strategies-from-crandall-christian-academy',
  'the-art-of-storytelling-in-early-childhood-development-unleashing-imagination-and-learning',
  'engaging-young-minds-interactive-learning-at-crandall-christian-academyintroduction',
  'the-importance-of-faith-in-early-learning-insights-from-crandall-christian-academyintroduction',
  'outdoor-learning-and-play-the-benefits-of-nature-in-preschool-education',
  'the-role-of-technology-in-preschool-education-what-parents-should-know',
  'effective-parent-teacher-communication-building-a-partnership-for-your-child-s-success',
  'nutrition-for-preschoolers-healthy-eating-habits-start-early',
  'the-importance-of-play-in-preschool-learning',
  'choosing-the-right-preschool-factors-to-consider',
  'understanding-early-childhood-development-what-to-expect-in-the-preschool-years-at-crandall-christi',
  '7-key-factors-to-consider-when-touring-crandall-christian-academy',
  'building-a-foundation-the-impact-of-early-childhood-educationintroduction',
  'title-managing-separation-anxiety-tips-for-a-tear-free-preschool-experience',
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function downloadImage(url: string, slug: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = url.match(/\.(jpg|jpeg|png|webp|avif)/i)?.[1] ?? 'jpg';
    const filename = `${slug}.${ext}`;
    const filepath = path.join(COVER_DIR, filename);
    await writeFile(filepath, buffer);
    return `/marketing/blog/${filename}`;
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(COVER_DIR)) {
    await mkdir(COVER_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  let successCount = 0;
  let errorCount = 0;

  for (const slug of SLUGS) {
    const url = `${BASE_URL}/${slug}`;
    console.log(`[${successCount + errorCount + 1}/${SLUGS.length}] ${slug}`);

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);

      const postData = await page.evaluate(() => {
        const titleEl = document.querySelector('h1');
        const title = titleEl?.textContent?.trim() ?? '';

        const bodyEl = document.querySelector('[data-hook="post-description__viewer"]') ??
                       document.querySelector('.post-content') ??
                       document.querySelector('article');
        const bodyHtml = bodyEl?.innerHTML ?? '';

        const coverEl = document.querySelector('[data-hook="blog-cover-image"] img') ??
                        document.querySelector('article img');
        const coverUrl = coverEl?.getAttribute('src') ?? null;

        const dateEl = document.querySelector('[data-hook="time-ago"]') ??
                       document.querySelector('time');
        const dateStr = dateEl?.getAttribute('datetime') ?? dateEl?.textContent ?? null;

        return { title, bodyHtml, coverUrl, dateStr };
      });

      let coverPath: string | null = null;
      if (postData.coverUrl) {
        coverPath = await downloadImage(postData.coverUrl, slug);
      }

      let publishedAt = new Date().toISOString();
      if (postData.dateStr) {
        const parsed = new Date(postData.dateStr);
        if (!isNaN(parsed.getTime())) publishedAt = parsed.toISOString();
      }

      const plainText = postData.bodyHtml.replace(/<[^>]*>/g, '').trim();
      const excerpt = plainText.slice(0, 200) + (plainText.length > 200 ? '...' : '');

      const { error } = await supabase.from('blog_posts').upsert(
        {
          tenant_id: TENANT_ID,
          slug,
          title: postData.title || slug.replace(/-/g, ' '),
          excerpt,
          body_html: postData.bodyHtml,
          cover_path: coverPath,
          author: 'Crandall Christian Academy',
          published_at: publishedAt,
          read_time_minutes: estimateReadTime(postData.bodyHtml),
          is_published: true,
        },
        { onConflict: 'tenant_id,slug' }
      );

      if (error) {
        console.error(`  DB error: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        console.log(`  ✓ ${postData.title.slice(0, 60)}`);
      }

      await page.close();
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
      errorCount++;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  await browser.close();
  console.log(`\nDone. ${successCount} success, ${errorCount} errors.`);
}

main();
