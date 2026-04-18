import Link from 'next/link';

const PROGRAM_PAIRS = [
  {
    left: {
      title: 'Infants',
      titleColor: 'text-cca-blue',
      bodyHex: '#3B70B0',
      body: 'Our infant program provides a safe, loving, and faith-filled environment where your baby is nurtured from the very beginning.',
      bg: 'bg-[#FAF7F2]',
    },
    right: {
      title: 'Toddlers',
      titleColor: 'text-[#E0472F]',
      bodyHex: '#E0472F',
      body: 'Our toddler program nurtures curiosity and early exploration in a safe, loving environment, promoting developmental milestones through hands-on activities.',
      bg: 'bg-white',
    },
  },
  {
    left: {
      title: 'Twos',
      titleColor: 'text-[#F2B020]',
      bodyHex: '#C89018',
      body: 'The 2s program introduces structure and socialization, encouraging early learning through age-appropriate activities that build confidence and independence.',
      bg: 'bg-[#FAF7F2]',
    },
    right: {
      title: 'Threes',
      titleColor: 'text-[#5CBA60]',
      bodyHex: '#4A9A4E',
      body: 'In our 3s program, children engage in creative learning experiences that develop early literacy, math, and social skills while fostering curiosity.',
      bg: 'bg-white',
    },
  },
  {
    left: {
      title: 'Pre-K',
      titleColor: 'text-cca-blue',
      bodyHex: '#3B70B0',
      body: 'The Pre-K program prepares children for kindergarten with a focus on academics, social-emotional growth, and faith-based learning.',
      bg: 'bg-[#FAF7F2]',
    },
    right: {
      title: 'Private Kinder',
      titleColor: 'text-[#F878AF]',
      bodyHex: '#E0609A',
      body: 'Our private kindergarten offers a well-rounded education, blending academic excellence, spiritual growth, and individualized attention.',
      bg: 'bg-white',
    },
  },
];

interface ProgramHalfProps {
  title: string;
  titleColor: string;
  bodyHex: string;
  body: string;
  bg: string;
}

function ProgramHalf({ title, titleColor, bodyHex, body, bg }: ProgramHalfProps) {
  return (
    <div className={`${bg} flex items-center justify-center p-8 md:p-16`}>
      <div className="max-w-md text-center">
        <h3 className={`font-kollektif text-3xl md:text-5xl ${titleColor} mb-4`}>{title}</h3>
        <p
          className="font-questrial text-base md:text-lg leading-relaxed mb-6"
          style={{ color: bodyHex, opacity: 0.85 }}
        >
          {body}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/about" className="bg-cca-blue text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-blue/90 transition-colors">
            Learn More
          </Link>
          <Link href="/enroll" className="bg-cca-blue text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-blue/90 transition-colors">
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StickyPrograms({ pair }: { pair: number }) {
  const data = PROGRAM_PAIRS[pair];
  return (
    <div className="sticky top-0 h-screen grid grid-rows-2 md:grid-rows-1 md:grid-cols-2" style={{ zIndex: pair }}>
      <ProgramHalf {...data.left} />
      <ProgramHalf {...data.right} />
    </div>
  );
}
