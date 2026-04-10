// @anchor: cca.documents.vault
// Document browser organized by entity type
// See CCA_BUILD_BRIEF.md §35

import { FileText, Download, Eye, Clock, Shield } from 'lucide-react'
import type { DocumentEntityType, DocumentType, DocumentStatus } from '@/lib/schemas/document'

interface DocumentDisplay {
  id: string
  title: string
  document_type: DocumentType
  entity_type: DocumentEntityType
  entity_id: string
  entity_name: string
  file_path: string
  mime_type: string
  version: number
  status: DocumentStatus
  expiry_date: string | null
  uploaded_at: string
  uploaded_by_name: string
}

interface DocumentVaultProps {
  documents: DocumentDisplay[]
  groupBy?: 'entity' | 'type' | 'status'
}

const STATUS_COLORS: Record<DocumentStatus, string> = {
  active: 'var(--color-success, #10B981)',
  expired: 'var(--color-destructive)',
  superseded: 'var(--color-warning)',
  archived: 'var(--color-muted-foreground)',
}

const TYPE_LABELS: Record<DocumentType, string> = {
  immunization: 'Immunization',
  custody_order: 'Custody Order',
  birth_certificate: 'Birth Certificate',
  photo_consent: 'Photo Consent',
  medical_action_plan: 'Medical Action Plan',
  handbook_ack: 'Handbook Acknowledgment',
  insurance_card: 'Insurance Card',
  background_check: 'Background Check',
  certification: 'Certification',
  license: 'License',
  inspection: 'Inspection',
  policy: 'Policy',
  other: 'Other',
}

export function DocumentVault({ documents, groupBy = 'entity' }: DocumentVaultProps) {
  // Group documents
  const grouped = new Map<string, DocumentDisplay[]>()
  for (const doc of documents) {
    const key = groupBy === 'entity'
      ? `${doc.entity_type}:${doc.entity_name}`
      : groupBy === 'type'
        ? doc.document_type
        : doc.status
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(doc)
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          No documents found. Upload documents to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([groupKey, docs]) => (
        <div key={groupKey}>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
            {groupBy === 'type' ? TYPE_LABELS[groupKey as DocumentType] ?? groupKey : groupKey.split(':')[1] ?? groupKey}
          </h3>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {docs.map((doc) => {
                const isExpiringSoon = doc.expiry_date && new Date(doc.expiry_date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000

                return (
                  <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-muted)' }}
                    >
                      <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                          {doc.title}
                        </p>
                        {doc.version > 1 && (
                          <span className="text-xs rounded px-1.5 py-0.5" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
                            v{doc.version}
                          </span>
                        )}
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[doc.status] }}
                          title={doc.status}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        <span>{TYPE_LABELS[doc.document_type]}</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        {doc.expiry_date && (
                          <span className="flex items-center gap-1" style={{ color: isExpiringSoon ? 'var(--color-warning)' : undefined }}>
                            <Clock size={10} />
                            Expires {new Date(doc.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="rounded p-1.5 hover:bg-gray-100"
                        style={{ color: 'var(--color-foreground)' }}
                        aria-label={`View ${doc.title}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="rounded p-1.5 hover:bg-gray-100"
                        style={{ color: 'var(--color-foreground)' }}
                        aria-label={`Download ${doc.title}`}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
