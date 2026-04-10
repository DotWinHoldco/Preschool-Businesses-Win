// @anchor: cca.checkin.parent-page
// Parent QR display page — shows QR codes for each child.
// Large, scannable display. Swipeable if multiple children.
// See CCA_BUILD_BRIEF.md §7

import { ParentQRDisplay } from './qr-display'

export const metadata = {
  title: 'Check-In QR Code',
  description: 'Show this QR code to staff when dropping off your child',
}

export default function ParentCheckInPage() {
  // TODO: Fetch real student QR data from Supabase based on authenticated parent
  // For now, pass placeholder data — in production, the parent's family_id is used
  // to look up their children and their active QR tokens from student_qr_codes table.
  return (
    <div className="mx-auto max-w-md py-8">
      <ParentQRDisplay />
    </div>
  )
}
