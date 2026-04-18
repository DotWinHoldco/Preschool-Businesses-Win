'use client'

import { useEffect } from 'react'
import Image from 'next/image'

export default function EnrollError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Enrollment Error]', error)
  }, [error])

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100/80">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <a href="https://crandallchristianacademy.com" className="flex-shrink-0">
            <Image
              src="/marketing/shared/cca-logo-full.png"
              alt="Crandall Christian Academy"
              width={338}
              height={118}
              className="h-12 md:h-14 w-auto"
              priority
            />
          </a>
        </div>
      </header>
      <main className="flex-1 py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            We ran into an issue loading the application. Please try again, or contact us
            if the problem continues.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center bg-[#3B70B0] text-white text-sm font-medium px-8 py-3 rounded-full hover:bg-[#3B70B0]/90 transition-colors"
            >
              Try Again
            </button>
            <a
              href="mailto:admin@crandallchristianacademy.com"
              className="inline-flex items-center justify-center border border-gray-200 text-gray-700 text-sm font-medium px-8 py-3 rounded-full hover:bg-gray-50 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
