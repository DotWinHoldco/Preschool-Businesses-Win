// @anchor: cca.emergency.admin-page

import { EmergencyClient } from '@/components/portal/emergency/emergency-client'

export default function AdminEmergencyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Emergency Controls
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage emergency alerts, drill schedules, and emergency contacts.
        </p>
      </div>
      <EmergencyClient />
    </div>
  )
}
