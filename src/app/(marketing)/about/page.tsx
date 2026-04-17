import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { ProgramCard } from '@/components/marketing/ProgramCard';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Crandall Christian Academy — our mission, our programs, and what makes us the premier preschool in Crandall, Texas.',
};

const APPLY_URL = '/enroll';

const PROGRAMS = [
  {
    slug: 'infants',
    title: 'Our Infant Classes',
    body: "From their very first days, your child is lovingly cared for in a Christ-centered environment designed for comfort, safety, and growth. Our infant program focuses on nurturing each baby with patience, prayer, and individualized care, creating a strong foundation for lifelong learning.",
    imageSrc: '/marketing/about/program-infants.jpg',
  },
  {
    slug: 'toddlers',
    title: 'Our Toddlers Classes',
    body: "Our toddler program provides a nurturing and stimulating environment designed to support your child's early developmental milestones. Through age-appropriate activities, sensory play, and loving care, toddlers explore the world around them while building a foundation for lifelong learning.",
    imageSrc: '/marketing/about/program-toddlers.jpg',
  },
  {
    slug: 'twos',
    title: 'Our 2s Classes',
    body: "In our 2s program, children take their first steps into a structured learning environment, separate from the toddler space. With a focus on fostering independence, socialization, and early academic skills, our 2s classroom encourages curiosity and confidence through guided play and hands-on exploration.",
    imageSrc: '/marketing/about/program-twos.jpg',
  },
  {
    slug: 'threes',
    title: 'Our 3s Class',
    body: "Our 3s program is designed to ignite curiosity and foster a love for learning in a warm, supportive environment. Through engaging activities, creative play, and age-appropriate lessons, children develop essential skills in literacy, math, and problem-solving while building social connections and confidence. This class provides the perfect balance of structure and exploration to help your child thrive.",
    imageSrc: '/marketing/about/program-threes.jpg',
  },
  {
    slug: 'preschool-kinder',
    title: 'Preschool & Private Kindergarten',
    body: "Our Preschool and Private Kindergarten programs provide a strong foundation for lifelong learning in a nurturing, faith-based environment. Preschool focuses on building essential skills in literacy, math, and social-emotional development through engaging, hands-on activities that foster curiosity and independence. Private Kindergarten offers a comprehensive, well-rounded curriculum with personalized attention to ensure your child is prepared for future academic success while growing in confidence and character.",
    imageSrc: '/marketing/about/program-preschool-kinder.jpg',
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative py-24 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">About</p>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink mb-6">
              Where Learning and Fun Come Together
            </h1>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/about/hero-playing-toddlers.jpg"
                alt="Children playing and learning at CCA"
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
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <SectionHeader
              heading="Our Mission"
              subheading="We support the growth and development of every child through personalized care."
              headingColor="text-cca-blue"
            />
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed mt-6">
              At Crandall Christian Academy, our mission is to provide a safe, loving, and educational environment where children can thrive. We believe in nurturing each child&apos;s unique abilities and fostering a lifelong love of learning.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8 text-left max-w-lg mx-auto">
              {[
                'Encouraging curiosity and creativity.',
                'Supporting emotional, social, and spiritual development.',
                'Building strong partnerships with families.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-cca-blue flex-shrink-0" />
                  <p className="font-questrial text-cca-ink/80">{item}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.25}>
            <Link
              href="/our-team"
              className="inline-block mt-8 bg-cca-blue text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-blue/90 transition-colors"
            >
              Meet Our Educators
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <section id="programs" className="py-20 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              heading="Our Programs"
              subheading="At Crandall Christian Academy, our programs are thoughtfully designed to nurture children's growth from toddlers to private kindergarten. Each program focuses on age-appropriate learning, fostering curiosity, independence, and a love for God in a safe and supportive environment."
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          {PROGRAMS.map((prog, i) => (
            <ProgramCard key={prog.slug} {...prog} applyUrl={APPLY_URL} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
