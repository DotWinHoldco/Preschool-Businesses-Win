import type { Metadata } from 'next';
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
      {/* === 1. HERO — "Where Little Minds Shine" spinning CTA === */}
      <SpinningCTA />

      {/* === 2. CONTENT ZONE — 4 blocks in one continuous section === */}
      <section className="bg-white py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="font-coming-soon text-3xl md:text-4xl text-cca-yellow">
                A Place To Shine Bright
              </h2>
              <p className="mt-4 text-lg text-cca-ink/70 max-w-2xl mx-auto font-questrial">
                Crandall Christian Academy&apos;s preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="text-center">
              <h3 className="font-coming-soon text-3xl md:text-4xl text-cca-yellow">
                More Than A Preschool
              </h3>
              <p className="mt-4 text-cca-ink/70 font-questrial max-w-2xl mx-auto">
                At Crandall Christian Academy, we&apos;re more than a place for learning — we&apos;re a loving, close-knit community where children, teachers, and families build meaningful relationships.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="text-center">
              <h3 className="font-coming-soon text-3xl md:text-4xl text-cca-yellow">
                Play, Explore, Discover, Grow.
              </h3>
              <p className="mt-4 text-cca-ink/70 font-questrial max-w-2xl mx-auto">
                At Crandall Christian Academy, we create spaces for students to play freely, explore new ideas, and discover their unique abilities.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="text-center pt-8">
              <h2 className="font-coming-soon text-4xl md:text-6xl text-cca-blue">
                A Parent&apos;s Dream Come True
              </h2>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* === 3. "Today's Learners. Tomorrow's Leaders. Together!" — video bg, blue overlay === */}
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
              Today&apos;s Learners.<br />Tomorrow&apos;s Leaders.<br />Together!
            </h2>
            <p className="font-questrial text-lg text-white/85 leading-relaxed mb-8 max-w-2xl mx-auto">
              At Crandall Christian Academy, we believe in partnering with parents to create the best environment for their child&apos;s growth and success. Through open communication and collaboration, we ensure every child feels supported, nurtured, and inspired to learn.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={APPLY_URL}
                className="inline-block bg-white text-cca-blue font-kollektif px-8 py-4 rounded-full hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Apply Now
              </Link>
              <Link
                href="/about"
                className="inline-block bg-transparent text-white font-kollektif px-8 py-4 rounded-full border-2 border-white/60 hover:bg-white/10 transition-all"
              >
                Learn More
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === 4. Curriculum — 4 pillar cards === */}
      <section className="py-20 px-6 bg-cca-cream">
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

      {/* === 7. "Why Choose Us" — WHITE bg, pink heart icons === */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="font-coming-soon text-sm uppercase tracking-widest text-cca-green mb-2">Why Choose Us</p>
            <h2 className="font-kollektif text-3xl md:text-4xl text-cca-ink mb-2">
              Every Child with Love &amp; Safety
            </h2>
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

      {/* === 9. Ambient Video — classroom footage, no text === */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <VideoBackground
          src1080={`${VIDEO_BASE}/more-than-a-preschool-1080p.mp4`}
          src720={`${VIDEO_BASE}/more-than-a-preschool-720p.mp4`}
          poster="/marketing/home/more-than-a-preschool.jpg"
          className="h-full"
          overlay="bg-black/10"
        >
          <span className="sr-only">Classroom video</span>
        </VideoBackground>
      </section>

      {/* === 10. Newsletter === */}
      <section className="py-16 px-6 bg-cca-cream">
        <div className="max-w-xl mx-auto">
          <NewsletterForm />
        </div>
      </section>

      {/* === 11. The Ingredients Of A Perfect Pre-School === */}
      <section className="py-24 md:py-32 px-6 bg-cca-cream">
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

      {/* === 12. "Crandall's New Pre-School Gem" — Final CTA === */}
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
