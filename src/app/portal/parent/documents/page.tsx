// @anchor: cca.documents.parent-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { FileText, Download } from 'lucide-react'

export default async function ParentDocumentsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Get families this user belongs to
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  const familyIds = memberships?.map(m => m.family_id) ?? []

  // Get studentIds from student_family_links
  const { data: studentLinks } = familyIds.length > 0
    ? await supabase
        .from('student_family_links')
        .select('student_id')
        .eq('tenant_id', tenantId)
        .in('family_id', familyIds)
    : { data: [] }
  const studentIds = [...new Set((studentLinks ?? []).map(l => l.student_id))]

  // Fetch student-level documents
  const { data: studentDocs } = studentIds.length > 0
    ? await supabase
        .from('documents')
        .select('id, title, document_type, entity_type, uploaded_at, file_path, mime_type, status')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'student')
        .in('entity_id', studentIds)
        .order('uploaded_at', { ascending: false })
    : { data: [] }

  // Fetch family-level documents
  const { data: familyDocs } = familyIds.length > 0
    ? await supabase
        .from('documents')
        .select('id, title, document_type, entity_type, uploaded_at, file_path, mime_type, status')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'family')
        .in('entity_id', familyIds)
        .order('uploaded_at', { ascending: false })
    : { data: [] }

  // Combine and sort by date
  const allDocuments = [...(studentDocs ?? []), ...(familyDocs ?? [])]
    .sort((a, b) => (b.uploaded_at ?? '').localeCompare(a.uploaded_at ?? ''))

  function formatDate(dateStr: string | null) {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          My Documents
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          View documents related to your family and students.
        </p>
      </div>

      {allDocuments.length > 0 ? (
        <div className="flex flex-col gap-2">
          {allDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-xl p-4"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                >
                  <FileText size={18} style={{ color: 'var(--color-muted-foreground)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {doc.document_type && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                        style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                      >
                        {doc.document_type.replace(/_/g, ' ')}
                      </span>
                    )}
                    <span className="text-xs capitalize" style={{ color: 'var(--color-muted-foreground)' }}>
                      {doc.entity_type}
                    </span>
                    {doc.uploaded_at && (
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {formatDate(doc.uploaded_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {doc.file_path && (
                <div className="shrink-0">
                  <Download size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <FileText size={24} style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No documents available.
          </p>
        </div>
      )}
    </div>
  )
}
