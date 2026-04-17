import Image from 'next/image';
import Link from 'next/link';

const APPLY_URL = '/enroll';

const PROGRAM_PAIRS = [
  {
    left: {
      title: 'Infants',
      body: 'Our infant program provides a safe, loving, and faith-filled environment where your baby is nurtured from the very beginning.',
      image: '/marketing/about/program-infants.jpg',
    },
    right: {
      title: 'Toddlers',
      body: 'Our toddler program nurtures curiosity and early exploration in a safe, loving environment, promoting developmental milestones through hands-on activities.',
      image: '/marketing/about/program-toddlers.jpg',
    },
  },
  {
    left: {
      title: 'Twos',
      body: 'The 2s program introduces structure and socialization, encouraging early learning through age-appropriate activities that build confidence and independence.',
      image: '/marketing/about/program-twos.jpg',
    },
    right: {
      title: 'Threes',
      body: 'In our 3s program, children engage in creative learning experiences that develop early literacy, math, and social skills while fostering curiosity.',
      image: '/marketing/about/program-threes.jpg',
    },
  },
  {
    left: {
      title: 'Pre-K',
      body: 'The Pre-K program prepares children for kindergarten with a focus on academics, social-emotional growth, and faith-based learning.',
      image: '/marketing/about/program-preschool-kinder.jpg',
    },
    right: {
      title: 'Private Kindergarten',
      body: 'Our private kindergarten offers a well-rounded education, blending academic excellence, spiritual growth, and individualized attention.',
      image: '/marketing/about/program-preschool-kinder.jpg',
    },
  },
];

function ProgramHalf({ title, body, image }: { title: string; body: string; image: string }) {
  return (
    <div className="relative flex items-center justify-center p-8 md:p-12">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center max-w-md">
        <h3 className="font-kollektif text-3xl md:text-5xl text-white mb-4">{title}</h3>
        <p className="font-questrial text-white/85 text-base md:text-lg leading-relaxed mb-6">{body}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/about"
            className="bg-white/20 backdrop-blur-sm text-white font-kollektif px-6 py-3 rounded-full hover:bg-white/30 transition-colors border border-white/30"
          >
            Learn More
          </Link>
          <Link
            href={APPLY_URL}
            className="bg-cca-blue text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-blue/90 transition-colors shadow-lg"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StickyPrograms() {
  return (
    <section>
      {PROGRAM_PAIRS.map((pair, i) => (
        <div
          key={i}
          className="sticky top-0 h-screen grid grid-rows-2 md:grid-rows-1 md:grid-cols-2"
          style={{ zIndex: i }}
        >
          <ProgramHalf {...pair.left} />
          <ProgramHalf {...pair.right} />
        </div>
      ))}
    </section>
  );
}
