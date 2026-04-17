import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { VideoBackground } from '@/components/marketing/VideoBackground';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { PillarCard } from '@/components/marketing/PillarCard';
import { CurriculumCard } from '@/components/marketing/CurriculumCard';
import { ValuePropCard } from '@/components/marketing/ValuePropCard';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { NewsletterForm } from '@/components/marketing/NewsletterForm';

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

const CURRICULUM = [
  {
    age: 'Infants',
    slug: 'infants',
    body: 'Our infant program provides a safe, loving, and faith-filled environment where your baby is nurtured from the very beginning. With attentive caregivers, low ratios, and individualized care, we focus on building trust, comfort, and early developmental milestones while partnering closely with parents every step of the way.',
    imageSrc: '/marketing/home/curriculum-infants.jpg',
  },
  {
    age: 'Toddlers',
    slug: 'toddlers',
    body: 'Our toddler program nurtures curiosity and early exploration in a safe, loving environment, promoting developmental milestones through hands-on activities and play.',
    imageSrc: '/marketing/home/curriculum-toddlers.jpg',
  },
  {
    age: 'Twos',
    slug: 'twos',
    body: 'The 2s program introduces structure and socialization, encouraging early learning through age-appropriate activities that build confidence, independence, and foundational skills.',
    imageSrc: '/marketing/home/curriculum-twos.jpg',
  },
  {
    age: 'Threes',
    slug: 'threes',
    body: 'In our 3s program, children engage in creative learning experiences that develop early literacy, math, and social skills while fostering curiosity and a love for discovery.',
  },
  {
    age: 'Pre-K',
    slug: 'preschool-kinder',
    body: 'The Pre-K program prepares children for kindergarten with a focus on academics, social-emotional growth, and faith-based learning in a supportive and engaging environment.',
  },
  {
    age: 'Private Kindergarten',
    slug: 'preschool-kinder',
    body: 'Our private kindergarten offers a well-rounded education, blending academic excellence, spiritual growth, and individualized attention to ensure children thrive in their first formal year of school.',
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
      {/* === SECTION 1: Hero === */}
      <VideoBackground
        src1080="/marketing/home/videos/facility-hero-1080p.mp4"
        src720="/marketing/home/videos/facility-hero-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="min-h-[80vh] flex items-center"
        overlay="bg-black/40"
      >
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <ScrollReveal>
            <div className="w-10 h-10 mx-auto mb-4">
              <Image
                src="/marketing/home/mascot-sunshine-face.png"
                alt=""
                width={40}
                height={40}
                aria-hidden="true"
              />
            </div>
            <h1 className="font-kollektif text-4xl md:text-6xl text-white mb-6">
              A Place To Shine Bright
            </h1>
            <p className="font-questrial text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
              Crandall Christian Academy&apos;s preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities. Our curriculum fosters creativity, social development, and foundational academic skills, preparing children for a bright future.
            </p>
            <Link
              href={APPLY_URL}
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Apply Now!
            </Link>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === SECTION 2: More Than A Preschool === */}
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
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-blue mb-6">
              More Than A Preschool
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed">
              At Crandall Christian Academy, we&apos;re more than a place for learning—we&apos;re a loving, close-knit community where children, teachers, and families build meaningful relationships. We celebrate each child&apos;s unique gifts, encourage their growth, and surround them with warmth, care, and connection. Together, we create a joyful environment where every child feels valued, supported, and inspired to thrive in every way.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* === SECTION 3: Play, Explore, Discover, Grow === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-coral mb-6">
              Play, Explore, Discover, Grow.
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed">
              At Crandall Christian Academy, we create spaces for students to play freely, explore new ideas, and discover their unique potential. Every day offers opportunities for active learning, fostering growth in mind, body and spirit. We nurture curiosity, creativity, and a sense of wonder as little ones thrive.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* === SECTION 4: A Parent's Dream Come True / Apply CTA === */}
      <VideoBackground
        src1080="/marketing/home/videos/facility-hero-1080p.mp4"
        src720="/marketing/home/videos/facility-hero-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="py-24"
        overlay="bg-black/50"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-yellow mb-3">
              A Parent&apos;s Dream Come True
            </p>
            <Link
              href={APPLY_URL}
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors shadow-lg"
            >
              Apply Now!
            </Link>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === SECTION 5: Peace of Mind for Parents === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">
              Peace of Mind for Parents
            </p>
            <h2 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-6">
              Today&apos;s Learners. Tomorrow&apos;s Leaders. Together!
            </h2>
            <p className="font-questrial text-lg text-cca-ink/80 leading-relaxed mb-8">
              At Crandall Christian Academy, we believe in partnering with parents to create the best environment for their child&apos;s growth and success. Through open communication and collaboration, we ensure every child feels supported, nurtured, and inspired to learn. Together, we build a foundation of trust and shared goals, giving parents peace of mind and children the tools they need to thrive. By working hand-in-hand, we help today&apos;s little learners grow into tomorrow&apos;s confident leaders.
            </p>
            <Link href="/about" className="inline-block bg-cca-blue text-white font-kollektif px-8 py-4 rounded-full hover:bg-cca-blue/90 transition-colors">
              Learn More
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* === SECTION 6: Learning Adventures (Four Pillars) === */}
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

      {/* === SECTION 7: Our Curriculum — Age Programs === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Our Programs"
              heading="Programs by Age"
              eyebrowColor="text-cca-green"
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {CURRICULUM.map((prog, i) => (
              <CurriculumCard
                key={prog.age}
                age={prog.age}
                body={prog.body}
                imageSrc={prog.imageSrc}
                slug={prog.slug}
                applyUrl={APPLY_URL}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* === SECTION 8: Why Choose Us === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Why Choose Us"
              heading="Every Child with Love & Safety"
              eyebrowColor="text-cca-pink"
              headingColor="text-cca-ink"
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
              className="inline-block bg-cca-blue text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-blue/90 transition-colors"
            >
              Apply Now!
            </Link>
          </div>
        </div>
      </section>

      {/* === SECTION 9: Newsletter === */}
      <VideoBackground
        src1080="/marketing/home/videos/newsletter-bg-1080p.mp4"
        src720="/marketing/home/videos/newsletter-bg-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="py-20"
        overlay="bg-cca-blue/80"
      >
        <div className="max-w-xl mx-auto px-6">
          <NewsletterForm />
        </div>
      </VideoBackground>

      {/* === SECTION 10: The CCA Difference === */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              eyebrow="The CCA Difference"
              heading="The Ingredients Of A Perfect Pre-School For Your Child"
              eyebrowColor="text-cca-green"
              headingColor="text-cca-ink"
            />
          </ScrollReveal>
          <div className="mt-12 divide-y divide-gray-100">
            {CCA_DIFFERENCE.map((feature, i) => (
              <FeatureRow key={feature.title} {...feature} reversed={i % 2 !== 0} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* === SECTION 11: Where Little Minds Shine — Closing CTA === */}
      <VideoBackground
        src1080="/marketing/home/videos/facility-hero-1080p.mp4"
        src720="/marketing/home/videos/facility-hero-720p.mp4"
        poster="/marketing/home/facility-hero-poster.jpg"
        className="py-28"
        overlay="bg-black/50"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="font-kollektif text-3xl md:text-5xl text-white mb-4">
              Where Little Minds Shine
            </h2>
            <p className="font-questrial text-lg text-white/80 mb-8">
              Lighting the Way for Lifelong Learning.
            </p>
            <Link
              href={APPLY_URL}
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors shadow-lg"
            >
              APPLY NOW
            </Link>
          </ScrollReveal>
        </div>
      </VideoBackground>

      {/* === SECTION 13: Now Enrolling — Final CTA === */}
      <section className="py-20 px-6 bg-cca-cream">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-coral mb-3">
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
              className="inline-block bg-cca-green text-white font-kollektif text-lg px-8 py-4 rounded-full hover:bg-cca-green/90 transition-colors"
            >
              Apply Now!
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
