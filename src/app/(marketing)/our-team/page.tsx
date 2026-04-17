import type { Metadata } from 'next';
import Image from 'next/image';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { StaffCard } from '@/components/marketing/StaffCard';
import { createServerClientWithoutTenant as createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Our Team',
  description: "Meet the dedicated educators and staff at Crandall Christian Academy committed to your child's growth.",
};

const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';

async function getStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, first_name, last_name, title, bio, avatar_url')
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch staff:', error);
    return [];
  }
  return data ?? [];
}

export default async function TeamPage() {
  const staff = await getStaff();

  return (
    <>
      <section className="relative py-24 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">Our Team</p>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink">
              Dedicated Educators Committed to Your Child&apos;s Growth
            </h1>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/team/hero-art-class.jpg"
                alt="Art class at CCA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {staff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {staff.map((member, i) => (
                <StaffCard
                  key={member.id}
                  name={`${member.first_name} ${member.last_name}`}
                  title={member.title ?? ''}
                  bio={member.bio ?? undefined}
                  headshotPath={member.avatar_url ?? '/marketing/shared/cca-logo-small.png'}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <div className="text-center py-12">
                <p className="font-questrial text-lg text-cca-ink/60">
                  Our team information is coming soon. Check back for updates!
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </>
  );
}
