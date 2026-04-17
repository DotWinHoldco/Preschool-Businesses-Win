import Image from 'next/image';
import Link from 'next/link';
import { VideoBackground } from './VideoBackground';

const VIDEO_BASE = 'https://oajfxyiqjqymuvevnoui.supabase.co/storage/v1/object/public/marketing-videos';

export function SpinningCTA() {
  return (
    <VideoBackground
      src1080={`${VIDEO_BASE}/facility-hero-1080p.mp4`}
      src720={`${VIDEO_BASE}/facility-hero-720p.mp4`}
      poster="/marketing/home/facility-hero-poster.jpg"
      className="min-h-[80vh] flex items-center"
      overlay="bg-black/50"
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <Link href="/enroll" className="inline-block mb-8 group">
          <div className="relative w-[240px] h-[240px] md:w-[280px] md:h-[280px] mx-auto">
            <div className="absolute inset-0 animate-[spin_7s_linear_infinite] motion-reduce:animate-none">
              <Image
                src="/marketing/home/mascot-sunshine-face.png"
                alt=""
                fill
                className="object-contain"
                aria-hidden="true"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Image
                src="/marketing/home/mascot-girl.png"
                alt="CCA Mascot"
                width={120}
                height={160}
                className="object-contain animate-[float_3s_ease-in-out_infinite] motion-reduce:animate-none drop-shadow-lg"
              />
            </div>
          </div>
        </Link>
        <h2 className="font-coming-soon text-4xl md:text-5xl text-white mb-3">
          Where Little Minds Shine
        </h2>
        <p className="font-questrial text-lg text-white/80 mb-8">
          Lighting the Way for Lifelong Learning.
        </p>
        <Link
          href="/enroll"
          className="inline-block bg-cca-blue text-white font-kollektif text-lg px-10 py-4 rounded-full hover:bg-cca-blue/90 transition-colors shadow-lg hover:shadow-xl"
        >
          APPLY NOW
        </Link>
      </div>
    </VideoBackground>
  );
}
