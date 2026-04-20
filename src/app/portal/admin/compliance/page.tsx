// @anchor: cca.compliance.admin-page

import { ComplianceClient } from '@/components/portal/compliance/compliance-client'

export default function AdminCompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Compliance Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          DFPS compliance scorecard, upcoming renewals, and inspection records.
        </p>
      </div>
      <ComplianceClient />
    </div>
  )
}
