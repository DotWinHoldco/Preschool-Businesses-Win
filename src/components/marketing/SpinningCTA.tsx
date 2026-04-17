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
      className="min-h-screen flex items-center"
      overlay="bg-black/20"
    >
      <div className="w-full min-h-screen relative flex flex-col items-center justify-center px-6 py-24">
        {/* Spinning "Now Enrolling" sunshine — top-right */}
        <Link href="/enroll" className="absolute top-[10%] right-[6%] md:right-[10%] lg:right-[15%] w-[200px] h-[200px] md:w-[280px] md:h-[280px] lg:w-[400px] lg:h-[400px] z-20">
          <Image
            src="/marketing/home/mascot-sunshine-face.png"
            alt="Now Enrolling"
            fill
            className="object-contain animate-[spin_7s_linear_infinite] motion-reduce:animate-none"
          />
        </Link>

        {/* Centered content */}
        <div className="flex flex-col items-center text-center">
          {/* Girl mascot — standalone, centered */}
          <Image
            src="/marketing/home/mascot-girl.png"
            alt="CCA Mascot"
            width={128}
            height={155}
            className="object-contain mb-6 drop-shadow-lg w-[100px] md:w-[128px]"
          />

          <h1 className="font-coming-soon text-5xl md:text-7xl lg:text-[7rem] text-white text-center">
            Where Little Minds Shine
          </h1>

          <p className="font-coming-soon text-lg md:text-xl text-white/80 text-center mt-4">
            Lighting the Way for Lifelong Learning.
          </p>

          <Link
            href="/enroll"
            className="inline-block bg-cca-blue text-white text-xl md:text-2xl rounded-full px-12 py-5 font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-2xl min-w-[300px] md:min-w-[420px] text-center mt-8"
          >
            APPLY NOW
          </Link>
        </div>
      </div>
    </VideoBackground>
  );
}
