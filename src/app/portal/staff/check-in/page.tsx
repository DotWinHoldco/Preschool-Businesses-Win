// @anchor: cca.checkin.staff-page
// Staff check-in station page — tab interface for QR Scan | PIN | Manual
// Full workflow: identify -> health screen -> allergy ack -> confirm
// Optimized for speed (under 10 seconds target)
// See CCA_BUILD_BRIEF.md §7

import { StaffCheckInStation } from './station'

export const metadata = {
  title: 'Check-In Station',
  description: 'Staff check-in station for student arrivals',
}

export default function StaffCheckInPage() {
  return (
    <div className="mx-auto max-w-2xl py-4">
      <StaffCheckInStation />
    </div>
  )
}
