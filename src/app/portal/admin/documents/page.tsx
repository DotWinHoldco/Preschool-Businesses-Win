// @anchor: cca.documents.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Pagination } from '@/components/ui/pagination'
import { parsePagination } from '@/lib/pagination'
import {
  DocumentsClient,
  type DocFolder,
  type DocFile,
} from '@/components/portal/documents/documents-client'

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extractExtension(mime: string | null, path: string | null): string {
  if (mime) {
    const map: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'image/png': 'PNG',
      'image/jpeg': 'JPG',
    }
    if (map[mime]) return map[mime]
  }
  if (path) {
    const ext = path.split('.').pop()?.toUpperCase()
    if (ext) return ext
  }
  return 'FILE'
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { page, perPage, offset } = parsePagination(await searchParams)
  const supabase = await createTenantAdminClient(tenantId)

  const { data: docs, count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: false })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const allDocs = docs ?? []

  // Build folders from distinct entity_type values
  const entityTypes = [...new Set(allDocs.map((d) => d.entity_type).filter(Boolean))]
  if (entityTypes.length === 0) entityTypes.push('General')

  const folders: DocFolder[] = entityTypes.map((et) => ({
    id: `folder-${et}`,
    name: (et as string).charAt(0).toUpperCase() + (et as string).slice(1).replace(/_/g, ' '),
    parentId: null,
  }))

  // Map docs to DocFile format
  const files: DocFile[] = allDocs.map((d) => ({
    id: d.id,
    name: d.title ?? d.file_path?.split('/').pop() ?? 'Untitled',
    type: extractExtension(d.mime_type, d.file_path),
    size: formatFileSize(d.file_size_bytes),
    folderId: `folder-${d.entity_type ?? 'General'}`,
    uploaded_at: d.created_at ?? new Date().toISOString(),
    uploaded_by: d.uploaded_by ?? 'Unknown',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-foreground)' }}
        >
          Document Vault
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Organize and manage school documents, policies, and records.
        </p>
      </div>

      {allDocs.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            No documents yet.
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Upload documents to get started.
          </p>
        </div>
      ) : (
        <DocumentsClient initialFolders={folders} initialFiles={files} />
      )}

      <Pagination page={page} perPage={perPage} total={count ?? 0} basePath="/portal/admin/documents" />
    </div>
  )
}
