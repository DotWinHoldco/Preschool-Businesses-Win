// @anchor: cca.notify.template.emergency-lockdown
// CRITICAL email template: Emergency lockdown notification

import * as React from 'react'

interface EmergencyLockdownProps { eventType: string; title: string; description?: string; isDrill: boolean; schoolName: string; timestamp: string }

export function EmergencyLockdownEmail({ eventType, title, description, isDrill, schoolName, timestamp }: EmergencyLockdownProps) {
  return (
    <div style={{ fontFamily: 'Open Sans, Arial, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32 }}>
      <div style={{ backgroundColor: isDrill ? '#F59E0B' : '#EF4444', color: 'white', padding: '16px', borderRadius: 8, marginBottom: 24, textAlign: 'center' as const }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
          {isDrill ? 'THIS IS A DRILL' : 'EMERGENCY ALERT'}
        </p>
        <p style={{ fontSize: 22, fontWeight: 800 }}>{title}</p>
      </div>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        {isDrill ? `${schoolName} is conducting a ${eventType.replace(/_/g, ' ')} drill.` : `${schoolName} has initiated a ${eventType.replace(/_/g, ' ')} at ${new Date(timestamp).toLocaleTimeString()}.`}
      </p>
      {description && <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6, marginTop: 12 }}>{description}</p>}
      {!isDrill && (
        <>
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 16, margin: '20px 0' }}>
            <p style={{ fontSize: 15, color: '#991B1B', fontWeight: 600 }}>All children are being kept safe. Do NOT come to the school unless directed by authorities.</p>
          </div>
          <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>We will send updates as the situation develops. You will receive an all-clear notification when the event has been resolved.</p>
        </>
      )}
      <hr style={{ border: 'none', borderTop: '1px solid #E5E5E5', margin: '24px 0' }} />
      <p style={{ fontSize: 12, color: '#737373' }}>This is an automated emergency notification from {schoolName}. Do not reply to this email.</p>
    </div>
  )
}
