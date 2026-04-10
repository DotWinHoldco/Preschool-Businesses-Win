// @anchor: marketing.home
// CCA marketing homepage — all sections per CCA_MARKETING_BRIEF.md §4.
// Hero → Programs → Faith → Director → Stats → Testimonials → CTA

import { Hero } from '@/components/home/hero'
import { ProgramsPreview } from '@/components/home/programs-preview'
import { FaithStatement } from '@/components/home/faith-statement'
import { FounderCutin } from '@/components/home/founder-cutin'
import { StatsStrip } from '@/components/home/stats-strip'
import { Testimonials } from '@/components/home/testimonials'
import { FinalCtaBand } from '@/components/home/final-cta-band'

export const metadata = {
  title: 'Crandall Christian Academy — Where Faith, Learning, and Play Come Together',
  description:
    'Crandall Christian Academy is a faith-based preschool in Crandall, TX. Small class sizes, CPR-certified staff, and daily transparency. Enroll your child today.',
}

export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <ProgramsPreview />
      <FaithStatement />
      <FounderCutin />
      <StatsStrip />
      <Testimonials />
      <FinalCtaBand />
    </>
  )
}
