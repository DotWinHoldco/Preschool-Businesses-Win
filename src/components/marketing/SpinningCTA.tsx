import Image from 'next/image'
import Link from 'next/link'
import { VideoBackground } from './VideoBackground'

const VIDEO_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marketing-videos`

export function SpinningCTA() {
  return (
    <VideoBackground
      src1080={`${VIDEO_BASE}/facility-hero-1080p.mp4`}
      src720={`${VIDEO_BASE}/facility-hero-720p.mp4`}
      poster="/marketing/home/facility-hero-poster.jpg"
      className="min-h-screen flex items-center"
      overlay="bg-black/25"
    >
      <div className="w-full min-h-screen relative flex flex-col items-center justify-end pb-20 px-6">
        {/* Spinning "Now Enrolling" sunshine — absolute top-right, INDEPENDENT */}
        <Link
          href="/enroll"
          className="absolute top-[8%] right-[6%] md:right-[10%] lg:right-[15%] w-[200px] h-[200px] md:w-[280px] md:h-[280px] lg:w-[400px] lg:h-[400px] z-20"
        >
          <Image
            src="/marketing/home/mascot-sunshine-face.png"
            alt="Now Enrolling"
            fill
            className="object-contain animate-[spin_7s_linear_infinite] motion-reduce:animate-none"
          />
        </Link>

        {/* Center content — girl + heading + subtitle + button */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/marketing/home/mascot-girl.png"
            alt="CCA Mascot"
            width={128}
            height={155}
            className="object-contain mb-6 drop-shadow-lg w-[100px] md:w-[128px]"
          />

          <h1 className="font-coming-soon text-5xl md:text-7xl lg:text-[7rem] text-white text-center leading-tight">
            Where Little Minds Shine
          </h1>

          <p className="font-coming-soon text-lg md:text-xl text-white/80 text-center mt-4">
            Lighting the Way for Lifelong Learning.
          </p>

          <Link
            href="/enroll"
            className="mt-8 bg-cca-blue text-white font-kollektif text-xl px-16 py-5 rounded-full min-w-[300px] md:min-w-[420px] text-center uppercase tracking-wider hover:scale-105 transition-transform shadow-2xl"
          >
            APPLY NOW
          </Link>
        </div>
      </div>
    </VideoBackground>
  )
}
