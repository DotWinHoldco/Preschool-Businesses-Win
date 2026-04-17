import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { VideoBackground } from '@/components/marketing/VideoBackground';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { PillarCard } from '@/components/marketing/PillarCard';
import { ValuePropCard } from '@/components/marketing/ValuePropCard';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { NewsletterForm } from '@/components/marketing/NewsletterForm';
import { StickyPrograms } from '@/components/marketing/StickyPrograms';
import { SpinningCTA } from '@/components/marketing/SpinningCTA';
import { MarqueeBanner } from '@/components/marketing/MarqueeBanner';

export const metadata: Metadata = {
  title: 'Home | Crandall Christian Academy',
  description: "Crandall Christian Academy's preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities.",
};

const APPLY_URL = '/enroll';
const VIDEO_BASE = 'https://oajfxyiqjqymuvevnoui.supabase.co/storage/v1/object/public/marketing-videos';

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

export default function HomePage() {
  return (
    <>
      {/* === 1. Hero — "A Place To Shine Bright" === */}
      <VideoBackground
        src1080={`${VIDEO_BASE}/facility-hero-1080p.mp4`}
        src720={`${VIDEO_BASE}/facility-hero-720p.mp4`}
        poster="/marketing/home/facility-hero-poster.jpg"
        className="min-h-[90vh] flex items-center"
        overlay="bg-black/40"
      >
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <ScrollReveal>
            <div className="w-12 h-12 mx-auto mb-5 animate-[float_3s_ease-in-out_infinite] motion-reduce:animate-none">
              <Image
                src="/marketing/home/mascot-sunshine-face.png"
                alt=""
                width={48}
                height={48}
                aria-hidden="true"
              />
            </div>
            <h1 className="font-kollektif text-4xl md:text-7xl text-white mb-6">
              A Place To Shine Bright
            </h1>
            <p className="font-questrial text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
              Crandall Christian Academy&apos;s preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities. Our curriculum fosters creativity, social development, and foundational academic skills, preparing children for a bright future.
            </p>
            <Link
              href={APPLY_URL}
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-10 py-4 rounded-full hover:bg-cca-green/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Apply Now!
            </Link>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === 2. Marquee — "A Parent's Dream Come True" === */}
      <MarqueeBanner />

      {/* === 3. "Today's Learners, Tomorrow's Leaders" — blue video section === */}
      <VideoBackground
        src1080={`${VIDEO_BASE}/facility-hero-1080p.mp4`}
        src720={`${VIDEO_BASE}/facility-hero-720p.mp4`}
        poster="/marketing/home/facility-hero-poster.jpg"
        className="py-28"
        overlay="bg-cca-blue/80"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-widest text-cca-yellow mb-4">
              Peace of Mind for Parents
            </p>
            <h2 className="font-kollektif text-3xl md:text-6xl text-white mb-6">
              Today&apos;s Learners. Tomorrow&apos;s Leaders. Together!
            </h2>
            <p className="font-questrial text-lg text-white/85 leading-relaxed mb-8 max-w-2xl mx-auto">
              At Crandall Christian Academy, we believe in partnering with parents to create the best environment for their child&apos;s growth and success. Through open communication and collaboration, we ensure every child feels supported, nurtured, and inspired to learn.
            </p>
            <Link
              href="/about"
              className="inline-block bg-white text-cca-blue font-kollektif px-8 py-4 rounded-full hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Learn More
            </Link>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === 4. More Than A Preschool === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <div className="relative aspect-[756/700] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/home/more-than-a-preschool.jpg"
                alt="Children learning together at CCA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <p className="font-coming-soon text-sm uppercase tracking-widest text-cca-coral mb-3">Play, Explore, Discover, Grow.</p>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-blue mb-6">
              More Than A Preschool
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed mb-6">
              At Crandall Christian Academy, we&apos;re more than a place for learning—we&apos;re a loving, close-knit community where children, teachers, and families build meaningful relationships. We celebrate each child&apos;s unique gifts, encourage their growth, and surround them with warmth, care, and connection.
            </p>
            <Link
              href="/about"
              className="inline-block bg-cca-blue text-white font-kollektif px-8 py-3 rounded-full hover:bg-cca-blue/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              About Us
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* === 5. Learning Adventures — Four Pillars === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Learning Adventures"
              heading="Our Curriculum"
              eyebrowColor="text-cca-pink"
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {PILLARS.map((pillar, i) => (
              <PillarCard key={pillar.title} {...pillar} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* === 6. Sticky Programs by Age === */}
      <StickyPrograms />

      {/* === 7. Why Choose Us — green background === */}
      <section className="py-24 px-6 bg-cca-green">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Why Choose Us"
              heading="Every Child with Love & Safety"
              eyebrowColor="text-white/70"
              headingColor="text-white"
              subheading="Crandall Christian Academy is dedicated to fostering academic excellence and Christian values in a nurturing environment. We strive to develop respectful, compassionate leaders who positively impact the world."
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {VALUE_PROPS.map((vp, i) => (
              <ValuePropCard key={vp.title} {...vp} index={i} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href={APPLY_URL}
              className="inline-block bg-white text-cca-green font-kollektif text-lg px-10 py-4 rounded-full hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Apply Now!
            </Link>
          </div>
        </div>
      </section>

      {/* === 8. "Where Little Minds Shine" — Spinning CTA === */}
      <SpinningCTA />

      {/* === 9. Newsletter === */}
      <section className="py-16 px-6 bg-cca-green">
        <div className="max-w-xl mx-auto">
          <NewsletterForm />
        </div>
      </section>

      {/* === 10. The CCA Difference — Ingredients === */}
      <section className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="The CCA Difference"
              heading="The Ingredients Of A Perfect Pre-School For Your Child"
              eyebrowColor="text-cca-green"
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          <div className="mt-16 space-y-2">
            {CCA_DIFFERENCE.map((feature, i) => (
              <FeatureRow key={feature.title} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* === 11. "Where Little Minds Shine" — Repeated CTA === */}
      <SpinningCTA />

      {/* === 12. Marquee — repeated === */}
      <MarqueeBanner />

      {/* === 13. Now Enrolling — Final CTA === */}
      <section className="py-24 px-6 bg-cca-cream">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-widest text-cca-coral mb-3">
              Now Enrolling
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
