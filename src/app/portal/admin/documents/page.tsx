// @anchor: cca.documents.admin-page

import {
  DocumentsClient,
  type DocFolder,
  type DocFile,
} from '@/components/portal/documents/documents-client'

// Mock data — replace with Supabase fetch when documents table exists
function getMockFolders(): DocFolder[] {
  return [
    { id: 'folder-general', name: 'General', parentId: null },
    { id: 'folder-policies', name: 'Policies', parentId: null },
    { id: 'folder-staff', name: 'Staff Records', parentId: null },
    { id: 'folder-students', name: 'Student Records', parentId: null },
    { id: 'folder-compliance', name: 'Compliance', parentId: null },
  ]
}

function getMockFiles(): DocFile[] {
  return [
    {
      id: 'file-1',
      name: 'Parent Handbook 2026',
      type: 'PDF',
      size: '2.4 MB',
      folderId: 'folder-general',
      uploaded_at: '2026-01-15T10:00:00Z',
      uploaded_by: 'Jane Smith',
    },
    {
      id: 'file-2',
      name: 'Emergency Procedures',
      type: 'PDF',
      size: '1.1 MB',
      folderId: 'folder-general',
      uploaded_at: '2026-02-03T14:30:00Z',
      uploaded_by: 'Jane Smith',
    },
    {
      id: 'file-3',
      name: 'Behavior Policy',
      type: 'DOCX',
      size: '340 KB',
      folderId: 'folder-policies',
      uploaded_at: '2025-11-20T09:00:00Z',
      uploaded_by: 'Maria Garcia',
    },
    {
      id: 'file-4',
      name: 'Medication Administration Policy',
      type: 'PDF',
      size: '580 KB',
      folderId: 'folder-policies',
      uploaded_at: '2025-12-01T11:15:00Z',
      uploaded_by: 'Jane Smith',
    },
    {
      id: 'file-5',
      name: 'Pickup Authorization Template',
      type: 'DOCX',
      size: '120 KB',
      folderId: 'folder-policies',
      uploaded_at: '2026-01-10T08:45:00Z',
      uploaded_by: 'Jane Smith',
    },
    {
      id: 'file-6',
      name: 'CPR Certificates - Spring 2026',
      type: 'PDF',
      size: '4.8 MB',
      folderId: 'folder-staff',
      uploaded_at: '2026-03-01T16:00:00Z',
      uploaded_by: 'Tom Wilson',
    },
    {
      id: 'file-7',
      name: 'Background Check Records',
      type: 'PDF',
      size: '3.2 MB',
      folderId: 'folder-staff',
      uploaded_at: '2026-01-25T10:30:00Z',
      uploaded_by: 'Jane Smith',
    },
    {
      id: 'file-8',
      name: 'Enrollment Packet - Thompson',
      type: 'PDF',
      size: '1.8 MB',
      folderId: 'folder-students',
      uploaded_at: '2026-03-15T13:00:00Z',
      uploaded_by: 'Maria Garcia',
    },
    {
      id: 'file-9',
      name: 'Immunization Records - Q1',
      type: 'XLSX',
      size: '890 KB',
      folderId: 'folder-students',
      uploaded_at: '2026-04-01T09:30:00Z',
      uploaded_by: 'Jane Smith',
    },
    {
      id: 'file-10',
      name: 'DFPS Inspection Report - March 2026',
      type: 'PDF',
      size: '2.1 MB',
      folderId: 'folder-compliance',
      uploaded_at: '2026-03-20T15:45:00Z',
      uploaded_by: 'Jane Smith',
    },
    {
      id: 'file-11',
      name: 'Fire Drill Log',
      type: 'XLSX',
      size: '45 KB',
      folderId: 'folder-compliance',
      uploaded_at: '2026-04-05T10:00:00Z',
      uploaded_by: 'Tom Wilson',
    },
    {
      id: 'file-12',
      name: 'Licensing Renewal Application',
      type: 'PDF',
      size: '1.5 MB',
      folderId: 'folder-compliance',
      uploaded_at: '2026-02-28T14:00:00Z',
      uploaded_by: 'Jane Smith',
    },
  ]
}

export default function AdminDocumentsPage() {
  const folders = getMockFolders()
  const files = getMockFiles()

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

      <DocumentsClient initialFolders={folders} initialFiles={files} />
    </div>
  )
}
