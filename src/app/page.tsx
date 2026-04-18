import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getSession } from '@/lib/auth/session'
import { LoginForm } from '@/app/portal/login/login-form'

export const metadata = {
  title: 'Crandall Christian Academy — Parent & Staff Portal',
  description: 'Sign in to the Crandall Christian Academy portal to manage enrollment, view schedules, and more.',
}

export default async function HomePage() {
  const session = await getSession()
  if (session) redirect('/portal')

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Image
              src="/marketing/shared/cca-logo-full.png"
              alt="Crandall Christian Academy"
              width={338}
              height={118}
              className="h-20 md:h-24 w-auto mx-auto"
              priority
            />
            <p className="mt-4 font-questrial text-sm text-cca-ink/50 tracking-wide">
              Parent &amp; Staff Portal
            </p>
          </div>

          {/* Login form */}
          <LoginForm />

          {/* Apply Now */}
          <div className="mt-5 text-center">
            <p className="font-questrial text-xs text-cca-ink/40 mb-2.5">
              New family? Start your application.
            </p>
            <a
              href="/enroll"
              className="inline-flex items-center justify-center w-full bg-cca-green text-white font-kollektif text-sm px-6 py-3 rounded-full hover:bg-cca-green/90 transition-colors shadow-sm"
            >
              Apply Now
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 px-4">
        <div className="flex flex-col items-center gap-1.5">
          <p className="font-questrial text-[11px] text-cca-ink/25">
            &copy; {new Date().getFullYear()} Crandall Christian Academy
          </p>
          <p className="font-questrial text-[10px] text-cca-ink/20">
            Where Little Minds Shine
          </p>
        </div>
      </footer>
    </div>
  )
}
