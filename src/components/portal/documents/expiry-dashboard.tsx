// @anchor: cca.documents.expiry-dashboard
// Dashboard showing documents approaching or past their expiry date
// See CCA_BUILD_BRIEF.md §35

import { AlertTriangle, Clock, FileText } from 'lucide-react'

interface ExpiringDocument {
  id: string
  title: string
  document_type: string
  entity_type: string
  entity_name: string
  expiry_date: string
  days_until_expiry: number
}

interface ExpiryDashboardProps {
  documents: ExpiringDocument[]
}

export function ExpiryDashboard({ documents }: ExpiryDashboardProps) {
  const expired = documents.filter((d) => d.days_until_expiry < 0)
  const urgent = documents.filter((d) => d.days_until_expiry >= 0 && d.days_until_expiry <= 7)
  const upcoming = documents.filter((d) => d.days_until_expiry > 7 && d.days_until_expiry <= 30)
  const later = documents.filter((d) => d.days_until_expiry > 30 && d.days_until_expiry <= 60)

  const sections = [
    { label: 'Expired', items: expired, color: 'var(--color-destructive)', icon: AlertTriangle },
    { label: 'Expiring This Week', items: urgent, color: 'var(--color-warning)', icon: AlertTriangle },
    { label: 'Expiring This Month', items: upcoming, color: 'var(--color-warning)', icon: Clock },
    { label: 'Expiring in 60 Days', items: later, color: 'var(--color-muted-foreground)', icon: Clock },
  ]

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--color-success, #10B981)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          No expiring documents. All documents are current.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map((section) => (
          <div
            key={section.label}
            className="rounded-lg border p-4 text-center"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            <p className="text-2xl font-bold" style={{ color: section.color }}>
              {section.items.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {section.label}
            </p>
          </div>
        ))}
      </div>

      {/* Detail lists */}
      {sections
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <div key={section.label}>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: section.color }}>
              <section.icon size={16} />
              {section.label} ({section.items.length})
            </h3>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {section.items.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                        {doc.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {doc.entity_name} - {doc.document_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: section.color }}>
                        {doc.days_until_expiry < 0
                          ? `${Math.abs(doc.days_until_expiry)} days ago`
                          : doc.days_until_expiry === 0
                            ? 'Today'
                            : `${doc.days_until_expiry} days`}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {new Date(doc.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
    </div>
  )
}
