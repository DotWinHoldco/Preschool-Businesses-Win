// @anchor: cca.carline.staff-page
// Carline queue board — real-time display of waiting parents.
// See CCA_BUILD_BRIEF.md §30

import { CarlineBoard } from './board'

export const metadata = {
  title: 'Carline Queue',
  description: 'Real-time pickup queue management',
}

export default function CarlinePage() {
  return (
    <div className="mx-auto max-w-4xl py-4">
      <CarlineBoard />
    </div>
  )
}
