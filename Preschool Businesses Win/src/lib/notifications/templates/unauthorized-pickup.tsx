// @anchor: cca.notify.template.unauthorized-pickup
// URGENT email template: Unauthorized pickup attempt

import * as React from 'react'

interface UnauthorizedPickupProps { studentName: string; attemptedBy: string; attemptedAt: string; classroomName: string; schoolName: string }

export function UnauthorizedPickupEmail({ studentName, attemptedBy, attemptedAt, classroomName, schoolName }: UnauthorizedPickupProps) {
  return (
    <div style={{ fontFamily: 'Open Sans, Arial, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32 }}>
      <div style={{ backgroundColor: '#EF4444', color: 'white', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontWeight: 700, fontSize: 16 }}>
        URGENT: Unauthorized Pickup Attempt
      </div>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        An unauthorized person attempted to pick up <strong>{studentName}</strong> from {classroomName}.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, margin: '16px 0' }}>
        <tbody>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Child</td><td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14 }}>{studentName}</td></tr>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Attempted by</td><td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14, color: '#EF4444' }}>{attemptedBy}</td></tr>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Time</td><td style={{ padding: '8px 0', fontSize: 14 }}>{attemptedAt}</td></tr>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Classroom</td><td style={{ padding: '8px 0', fontSize: 14 }}>{classroomName}</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6, fontWeight: 600 }}>
        The pickup was BLOCKED. Your child is safe. Please contact {schoolName} immediately if this was unexpected.
      </p>
    </div>
  )
}
