// @anchor: cca.notify.template.daily-report
// Email template: Daily report published notification

import * as React from 'react'

interface DailyReportPublishedProps { parentName: string; studentName: string; date: string; entryCount: number; portalUrl: string }

export function DailyReportPublishedEmail({ parentName, studentName, date, entryCount, portalUrl }: DailyReportPublishedProps) {
  return (
    <div style={{ fontFamily: 'Open Sans, Arial, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>
        {studentName}&apos;s daily report is ready
      </h1>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>Hi {parentName},</p>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        {studentName}&apos;s daily report for {date} has been published with {entryCount} entries including meals, activities, and more.
      </p>
      <div style={{ margin: '24px 0', textAlign: 'center' as const }}>
        <a href={portalUrl} style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: '#2563EB', color: 'white', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
          View Report
        </a>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #E5E5E5', margin: '24px 0' }} />
      <p style={{ fontSize: 12, color: '#737373' }}>Manage notification preferences in your portal settings.</p>
    </div>
  )
}
