import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { PillarCard } from '@/components/marketing/PillarCard';
import { ValuePropCard } from '@/components/marketing/ValuePropCard';
import { NewsletterForm } from '@/components/marketing/NewsletterForm';
import { StickyPrograms } from '@/components/marketing/StickyPrograms';
import { SpinningCTA } from '@/components/marketing/SpinningCTA';

export const metadata: Metadata = {
  title: 'Home | Crandall Christian Academy',
  description: "Crandall Christian Academy's preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities.",
};

const APPLY_URL = '/enroll';

const PILLARS = [
  {
    title: 'Creative Arts',
    body: 'From painting and crafting to music and imaginative play, our creative arts program inspires self-expression, builds confidence, and nurtures a love for the arts. By engaging their imaginations and developing fine motor skills, children discover the joy of creating while growing in their ability to think critically and solve problems.',
    imageSrc: '/marketing/home/pillar-creative-arts.jpg',
    accentColor: 'bg-cca-green',
  },
  {
    title: 'Curiosity and Discovery',
    body: 'At Crandall Christian Academy, we nurture a sense of wonder by encouraging children to explore, question, and discover the world around them. Through hands-on activities and interactive learning experiences, young minds develop problem-solving skills, creativity, and a lifelong love for discovery. Our program inspires curiosity and equips children with the tools to think critically and innovate with confidence.',
    imageSrc: '/marketing/home/pillar-curiosity-discovery.jpg',
    accentColor: 'bg-cca-blue',
  },
  {
    title: 'Language and Literacy',
    body: 'Students develop the foundation for strong communication skills through engaging language and literacy activities. From storytime and early writing exercises to phonics and vocabulary building, children develop the tools they need to express themselves and connect with the world. Our program fosters a love for reading, enhances comprehension, and builds confidence in young learners as they discover the power of words and storytelling.',
    imageSrc: '/marketing/home/pillar-language-literacy.jpg',
    accentColor: 'bg-cca-coral',
  },
  {
    title: 'Physical Development',
    body: "Together, we support your child's growth through activities that promote strength, coordination, and overall wellness. From active play and movement exercises to fine and gross motor skill development, our program helps our students build healthy habits and confidence in their abilities. By staying active and engaged, children develop the physical foundation they need to thrive in learning and in life!",
    imageSrc: '/marketing/home/pillar-physical-development.jpg',
    accentColor: 'bg-cca-yellow',
  },
];

const VALUE_PROPS = [
  {
    title: 'Faith-Centered Education',
    body: 'We integrate Christian values into every aspect of learning, fostering spiritual growth alongside academic success for a well-rounded foundation.',
  },
  {
    title: 'Exceptional Teachers & Curriculum',
    body: 'Our experienced educators and age-appropriate curriculum ensure your child receives personalized attention and the tools they need to thrive.',
  },
  {
    title: 'Safe & Nurturing Environment',
    body: 'CCA provides a loving, secure space where children feel supported as they explore, grow, and develop their God-given potential.',
  },
];

const CCA_DIFFERENCE = [
  {
    title: 'Highly Experienced Leadership & Highly Trained Staff',
    body: 'Our leadership team brings years of early childhood and Christian education experience, and our teachers are highly trained, caring, and consistent, creating a safe, structured, and loving environment for every child.',
  },
  {
    title: 'A Premier Preschool, Right Here in Crandall',
    body: "Crandall finally has a premier local preschool families can be proud of. Our brand new, state-of-the-art 8,000 SF facility gives your child a beautiful place to learn and grow, right here in the community.",
  },
  {
    title: 'A Curriculum That Prepares Your Child',
    body: 'Our preschool curriculum blends joyful, play-based learning with the structure kids thrive on, building early literacy, math readiness, and social-emotional skills through hands-on activities, guided discovery, and purposeful daily routines.',
  },
  {
    title: 'Safety You Can Feel',
    body: "Your child's safety is our highest priority, and it's built into everything we do. Our state-of-the-art campus features 24/7 gated and controlled access, advanced facial recognition, and layered security measures, all working quietly in the background so kids can focus on what they do best: learning, playing, and being cared for. From drop-off to pick-up, families get real peace of mind in a warm, joyful environment.",
  },
];

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 20L30 70V180H75V130H90V180H110V130H125V180H170V70L100 20Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <rect x="55" y="85" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="90" y="85" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="125" y="85" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="55" y="115" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="125" y="115" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M100 20L100 50" stroke="currentColor" strokeWidth="3" />
      <line x1="85" y1="50" x2="115" y2="50" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="55" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M92 180V155H108V180" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function PeopleGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="55" r="20" strokeWidth="4" />
      <path d="M60 170V140C60 120 80 105 100 105C120 105 140 120 140 140V170" strokeWidth="4" strokeLinecap="round" />
      <circle cx="55" cy="70" r="15" strokeWidth="3.5" />
      <path d="M25 170V145C25 130 38 118 55 118C62 118 68 120 73 124" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="145" cy="70" r="15" strokeWidth="3.5" />
      <path d="M175 170V145C175 130 162 118 145 118C138 118 132 120 127 124" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function PlaygroundIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="30" x2="50" y2="180" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="30" x2="150" y2="80" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 80Q100 90 150 80" strokeWidth="4" strokeLinecap="round" />
      <line x1="150" y1="80" x2="150" y2="180" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="130" x2="90" y2="130" strokeWidth="3" strokeLinecap="round" />
      <line x1="90" y1="130" x2="90" y2="180" strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="120" r="5" strokeWidth="2.5" />
      <path d="M30 180H170" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function WaveDivider({ from = '#FFFFFF', to = '#FAF9F5' }: { from?: string; to?: string }) {
  return (
    <div className="w-full overflow-hidden leading-[0]" style={{ backgroundColor: from }}>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-[50px] md:h-[70px]">
        <path d="M0,0 C300,100 900,20 1200,80 L1200,120 L0,120 Z" fill={to} />
      </svg>
    </div>
  );
}

const BLOB_MASK = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23000' d='M44.7,-76.4C58.8,-69.2,71.8,-58.7,79.6,-45.3C87.4,-31.9,89.9,-15.9,88.3,-0.9C86.7,14.1,80.9,28.3,73.1,41.4C65.3,54.6,55.4,66.7,42.8,74.4C30.2,82.1,15.1,85.3,0.2,85C-14.8,84.7,-29.5,80.9,-42.4,73.5C-55.3,66.1,-66.3,55.2,-73.6,42.1C-81,29.1,-84.6,14.5,-84.4,0.1C-84.2,-14.3,-80.1,-28.5,-72.5,-40.7C-64.9,-52.9,-53.8,-63,-41.1,-71C-28.4,-79,-14.2,-84.8,0.6,-85.8C15.4,-86.8,30.7,-83.1,44.7,-76.4Z' transform='translate(100 100)'/%3E%3C/svg%3E\")";

export default function HomePage() {
  return (
    <>
      {/* === 1. HERO — "Where Little Minds Shine" === */}
      <SpinningCTA />

      {/* === 2. CONTENT ZONE — "A Parent's Dream Come True" + 3 columns with SVG icons === */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="font-coming-soon text-4xl md:text-6xl text-cca-blue text-center mb-16">
              A Parent&apos;s Dream Come True
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <ScrollReveal>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <BuildingIcon className="w-20 h-20 md:w-[100px] md:h-[100px] text-[#1C31F4]" />
                </div>
                <div>
                  <h3 className="font-coming-soon text-2xl text-cca-yellow mb-3">
                    A Place To Shine Bright
                  </h3>
                  <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">
                    Crandall Christian Academy&apos;s preschool program in Crandall, Texas, provides a faith-based, nurturing environment where young minds flourish through hands-on learning and character-building activities.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <PeopleGroupIcon className="w-20 h-20 md:w-[100px] md:h-[100px] text-[#F26656]" />
                </div>
                <div>
                  <h3 className="font-coming-soon text-2xl text-cca-yellow mb-3">
                    More Than A Preschool
                  </h3>
                  <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">
                    At Crandall Christian Academy, we&apos;re more than a place for learning — we&apos;re a Christ-centered, close-knit community where children, teachers, and families build meaningful relationships.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <PlaygroundIcon className="w-20 h-20 md:w-[100px] md:h-[100px] text-[#266040]" />
                </div>
                <div>
                  <h3 className="font-coming-soon text-2xl text-cca-yellow mb-3">
                    Play, Explore, Discover, Grow.
                  </h3>
                  <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">
                    At Crandall Christian Academy, we create spaces for students to play freely, explore new ideas, and discover their unique potential through joyful, hands-on experiences.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <WaveDivider from="#FFFFFF" to="#FAF9F5" />

      {/* === 3. "Today's Learners" — cream bg, 2-column, blob-masked image === */}
      <section className="py-20 md:py-28 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <ScrollReveal>
            <div className="relative">
              <div className="absolute -top-8 -left-8 w-[80%] h-[80%] bg-cca-yellow/20 rounded-full blur-3xl" />
              <div
                className="relative"
                style={{
                  maskImage: BLOB_MASK,
                  WebkitMaskImage: BLOB_MASK,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              >
                <Image
                  src="/marketing/home/more-than-a-preschool.jpg"
                  alt="Children learning together"
                  width={757}
                  height={700}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="mt-8">
                <Link
                  href={APPLY_URL}
                  className="bg-cca-blue text-white font-kollektif text-lg px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-lg inline-block"
                >
                  Apply Now!
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div>
              <p className="font-coming-soon text-base text-cca-blue mb-3">
                Peace of Mind for Parents
              </p>
              <h2 className="font-kollektif text-3xl md:text-5xl text-cca-ink leading-tight mb-6">
                Today&apos;s Learners.<br />
                Tomorrow&apos;s Leaders.<br />
                Together!
              </h2>
              <p className="font-questrial text-cca-ink/70 text-lg leading-relaxed mb-8">
                At Crandall Christian Academy, we believe in partnering with parents to create the best environment for their child&apos;s growth and success. Through open communication and collaboration, we ensure every child feels supported, nurtured, and inspired to learn.
              </p>
              <hr className="border-gray-200 mb-4" />
              <div className="flex justify-end">
                <Link href="/about" className="font-kollektif text-cca-ink flex items-center gap-2 hover:text-cca-blue transition-colors">
                  Learn More
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider from="#FAF9F5" to="#FFFFFF" />

      {/* === 4. Curriculum — 4 circular pillar cards === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Learning Adventures"
              heading="Our Curriculum"
              eyebrowColor="text-cca-pink"
              headingColor="text-cca-green"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {PILLARS.map((pillar, i) => (
              <PillarCard key={pillar.title} {...pillar} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* === 5. Sticky: Infants / Toddlers === */}
      <StickyPrograms pair={0} />

      {/* === 6. Sticky: Twos / Threes === */}
      <StickyPrograms pair={1} />

      {/* === 7. Why Choose Us — white bg, 2-column, pink hearts === */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-4">
              Why Choose Us
            </h2>
            <p className="font-kollektif text-2xl md:text-3xl text-cca-yellow mb-4">
              Every Child with Love &amp; Safety
            </p>
            <p className="font-questrial text-cca-ink/70 leading-relaxed mb-4">
              Crandall Christian Academy is dedicated to fostering academic excellence and Christian values in a nurturing environment.
            </p>
            <p className="font-questrial text-cca-ink/70 leading-relaxed mb-6">
              Crandall Christian Academy prides itself on being a place of learning, development, and safety for children and families.
            </p>
            <Link href={APPLY_URL} className="inline-block bg-cca-blue text-white font-kollektif px-8 py-3 rounded-full hover:scale-105 transition-transform">
              Apply Now!
            </Link>
          </div>
          <div className="space-y-6">
            {VALUE_PROPS.map((vp, i) => (
              <ValuePropCard key={vp.title} {...vp} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* === 8. Sticky: Pre-K / Private Kinder === */}
      <StickyPrograms pair={2} />

      {/* === 9. Ambient Photos — side-by-side classroom images === */}
      <section className="grid grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="/marketing/home/pillar-physical-development.jpg"
            alt="Active play at CCA"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="/marketing/home/pillar-curiosity-discovery.jpg"
            alt="Discovery and learning"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
      </section>

      {/* === 10. Newsletter — blue card on white bg === */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto bg-cca-blue rounded-2xl p-8 md:p-12">
          <NewsletterForm />
        </div>
      </section>

      <WaveDivider from="#FFFFFF" to="#FAF9F5" />

      {/* === 11. The Ingredients Of A Perfect Pre-School — 2×2 blue card grid === */}
      <section className="py-24 md:py-32 px-6 bg-cca-cream">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="The CCA Difference"
              heading="The Ingredients Of A Perfect Pre-School For Your Child"
              eyebrowColor="text-cca-pink"
              headingColor="text-cca-green"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            {CCA_DIFFERENCE.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 0.1}>
                <div className="bg-cca-blue rounded-2xl p-8 md:p-10 h-full">
                  <h3 className="font-kollektif text-xl md:text-2xl text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="font-questrial text-white/85 text-base leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* === 12. "Crandall's New Pre-School Gem" — Final CTA === */}
      <section className="py-24 px-6 bg-cca-cream">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-lg text-cca-coral mb-2">
              Our Facility Is Almost Complete!
            </p>
            <p className="font-kollektif text-xl md:text-2xl text-cca-yellow underline underline-offset-4 decoration-cca-yellow/50 mb-6">
              NOW ENROLLING
            </p>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-6">
              Crandall&apos;s New Pre-School Gem
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed mb-8">
              Located in the heart of Crandall, Texas, our facility is designed to provide a warm and welcoming environment where children can learn, grow, and thrive. With state-of-the-art classrooms, engaging activity spaces, and a nurturing atmosphere, we focus on creating a home away from home for our students. Every detail of our facility reflects our commitment to fostering curiosity, creativity, and a sense of community, ensuring every child feels safe, supported, and inspired each day.
            </p>
            <Link
              href={APPLY_URL}
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-10 py-4 rounded-full hover:bg-cca-green/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Apply Now!
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
