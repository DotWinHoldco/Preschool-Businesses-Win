// @anchor: cca.notify.template.checkin-confirmation
// Email template: Check-in confirmation sent to parents
// See CCA_BUILD_BRIEF.md §13

import * as React from 'react'

interface CheckInConfirmationProps {
  parentName: string
  studentName: string
  classroomName: string
  checkedInAt: string
  checkedInBy: string
}

export function CheckInConfirmationEmail({
  parentName,
  studentName,
  classroomName,
  checkedInAt,
  checkedInBy,
}: CheckInConfirmationProps) {
  return (
    <div style={{ fontFamily: 'Open Sans, Arial, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>
        {studentName} is checked in
      </h1>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        Hi {parentName},
      </p>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        {studentName} has been checked in to <strong>{classroomName}</strong> at{' '}
        {new Date(checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} by {checkedInBy}.
      </p>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        Have a great day!
      </p>
      <hr style={{ border: 'none', borderTop: '1px solid #E5E5E5', margin: '24px 0' }} />
      <p style={{ fontSize: 12, color: '#737373' }}>
        You received this because you are a parent/guardian at the school. To manage notification preferences, visit your portal settings.
      </p>
    </div>
  )
}
