'use client'

// @anchor: cca.documents.uploader
// Document upload component with drag-and-drop support
// See CCA_BUILD_BRIEF.md §35

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import type { DocumentType, DocumentEntityType } from '@/lib/schemas/document'

interface DocumentUploaderProps {
  entityType: DocumentEntityType
  entityId: string
  onUpload: (file: File, metadata: { title: string; document_type: DocumentType; expiry_date?: string }) => void
  uploading?: boolean
  accept?: string
}

const DOC_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: 'immunization', label: 'Immunization Record' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'custody_order', label: 'Custody Order' },
  { value: 'photo_consent', label: 'Photo Consent' },
  { value: 'medical_action_plan', label: 'Medical Action Plan' },
  { value: 'handbook_ack', label: 'Handbook Acknowledgment' },
  { value: 'insurance_card', label: 'Insurance Card' },
  { value: 'background_check', label: 'Background Check' },
  { value: 'certification', label: 'Certification' },
  { value: 'license', label: 'License' },
  { value: 'inspection', label: 'Inspection Report' },
  { value: 'policy', label: 'Policy Document' },
  { value: 'other', label: 'Other' },
]

export function DocumentUploader({
  entityType,
  entityId,
  onUpload,
  uploading = false,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
}: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState<DocumentType>('other')
  const [expiryDate, setExpiryDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    }
  }, [title])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
      }
    },
    [title],
  )

  const handleSubmit = () => {
    if (!selectedFile || !title.trim()) return
    onUpload(selectedFile, {
      title: title.trim(),
      document_type: docType,
      expiry_date: expiryDate || undefined,
    })
  }

  const clearFile = () => {
    setSelectedFile(null)
    setTitle('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className="rounded-lg border-2 border-dashed p-8 text-center transition-colors"
        style={{
          borderColor: dragActive ? 'var(--color-primary)' : 'var(--color-border)',
          backgroundColor: dragActive ? 'var(--color-primary-50, #EFF6FF)' : 'var(--color-background)',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText size={24} style={{ color: 'var(--color-primary)' }} />
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {selectedFile.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button type="button" onClick={clearFile} className="p-1 rounded hover:bg-gray-100" aria-label="Remove file">
              <X size={16} style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
              Drag and drop a file, or{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium underline"
                style={{ color: 'var(--color-primary)' }}
              >
                browse
              </button>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
              PDF, JPG, PNG, DOC up to 10 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload document"
        />
      </div>

      {/* Metadata form */}
      {selectedFile && (
        <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <div>
            <label htmlFor="doc-title" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
            />
          </div>
          <div>
            <label htmlFor="doc-type" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
              Document Type
            </label>
            <select
              id="doc-type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
            >
              {DOC_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="doc-expiry" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
              Expiry Date (optional)
            </label>
            <input
              id="doc-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || uploading}
            className="w-full rounded-md py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      )}
    </div>
  )
}
