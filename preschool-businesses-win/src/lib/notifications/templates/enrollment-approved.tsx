// @anchor: cca.notify.template.enrollment-approved
// Email template: Enrollment application approved

import * as React from 'react'

interface EnrollmentApprovedProps { parentName: string; studentName: string; classroomName: string; startDate: string; onboardingUrl: string; schoolName: string }

export function EnrollmentApprovedEmail({ parentName, studentName, classroomName, startDate, onboardingUrl, schoolName }: EnrollmentApprovedProps) {
  return (
    <div style={{ fontFamily: 'Open Sans, Arial, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32 }}>
      <div style={{ backgroundColor: '#10B981', color: 'white', padding: '12px 16px', borderRadius: 8, marginBottom: 24, textAlign: 'center' as const, fontWeight: 700, fontSize: 16 }}>
        Welcome to {schoolName}!
      </div>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>Hi {parentName},</p>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        Great news! {studentName}&apos;s enrollment application has been <strong>approved</strong>. We are excited to welcome your family to {schoolName}.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, margin: '16px 0', backgroundColor: '#F9FAFB', borderRadius: 8, overflow: 'hidden' as const }}>
        <tbody>
          <tr><td style={{ padding: '12px 16px', color: '#737373', fontSize: 14 }}>Student</td><td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{studentName}</td></tr>
          <tr><td style={{ padding: '12px 16px', color: '#737373', fontSize: 14 }}>Classroom</td><td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{classroomName}</td></tr>
          <tr><td style={{ padding: '12px 16px', color: '#737373', fontSize: 14 }}>Start Date</td><td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{startDate}</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>
        To get started, please complete the onboarding checklist. This includes emergency contacts, allergy information, immunization records, and a few forms to sign.
      </p>
      <div style={{ margin: '24px 0', textAlign: 'center' as const }}>
        <a href={onboardingUrl} style={{ display: 'inline-block', padding: '14px 36px', backgroundColor: '#2563EB', color: 'white', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          Complete Onboarding
        </a>
      </div>
      <p style={{ fontSize: 13, color: '#737373' }}>If you have questions, reply to this email or call us. We look forward to seeing {studentName} on their first day!</p>
    </div>
  )
}
