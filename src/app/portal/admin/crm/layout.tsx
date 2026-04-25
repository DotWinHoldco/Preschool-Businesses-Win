// @anchor: cca.crm.layout
// CRM section layout — shared tab nav across Contacts / Audiences /
// Campaigns / Templates / Automations.

import { CRMTabs } from './crm-tabs'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <CRMTabs />
      <div>{children}</div>
    </div>
  )
}
