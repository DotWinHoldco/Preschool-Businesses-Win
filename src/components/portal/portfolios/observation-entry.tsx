// @anchor: cca.portfolio.observation-entry
'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { Camera, Video, FileText, Upload, X } from 'lucide-react'

interface ObservationEntryProps {
  studentId: string
  studentName: string
  onSubmit: (data: {
    title: string
    narrative: string
    visibility: 'parent' | 'staff_only'
    learning_domain_ids: string[]
    media: Array<{ file_path: string; media_type: 'photo' | 'video' | 'document'; caption?: string }>
  }) => void
  domains?: Array<{ id: string; domain_name: string; framework: string }>
}

export function ObservationEntry({ studentId, studentName, onSubmit, domains = [] }: ObservationEntryProps) {
  const [title, setTitle] = useState('')
  const [narrative, setNarrative] = useState('')
  const [visibility, setVisibility] = useState<'parent' | 'staff_only'>('parent')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [media, setMedia] = useState<Array<{ file_path: string; media_type: 'photo' | 'video' | 'document'; caption?: string }>>([])
  const [submitting, setSubmitting] = useState(false)

  const toggleDomain = (id: string) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const handleMediaAdd = useCallback((type: 'photo' | 'video' | 'document') => {
    // Placeholder: in production, this would open file picker / camera
    const placeholder = `uploads/${studentId}/${Date.now()}-${type}`
    setMedia((prev) => [...prev, { file_path: placeholder, media_type: type }])
  }, [studentId])

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !narrative.trim()) return
    setSubmitting(true)
    try {
      onSubmit({
        title,
        narrative,
        visibility,
        learning_domain_ids: selectedDomains,
        media,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">
        New Observation
      </h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
        Recording observation for <span className="font-medium text-[var(--color-foreground)]">{studentName}</span>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., First time counting to 10"
            className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            What did you observe?
          </label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={4}
            placeholder="Describe what the child did, said, or created..."
            className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        {/* Media buttons */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Attachments</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleMediaAdd('photo')}
              className="flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <Camera className="h-3.5 w-3.5" /> Photo
            </button>
            <button
              type="button"
              onClick={() => handleMediaAdd('video')}
              className="flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <Video className="h-3.5 w-3.5" /> Video
            </button>
            <button
              type="button"
              onClick={() => handleMediaAdd('document')}
              className="flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> File
            </button>
          </div>
          {media.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded bg-[var(--color-muted)] px-2 py-1 text-xs text-[var(--color-muted-foreground)]"
                >
                  <Upload className="h-3 w-3" />
                  {m.media_type}
                  <button onClick={() => removeMedia(i)} className="text-[var(--color-destructive)]">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning domains */}
        {domains.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-2">
              Learning Domains
            </label>
            <div className="flex flex-wrap gap-1.5">
              {domains.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDomain(d.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    selectedDomains.includes(d.id)
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]'
                  )}
                >
                  {d.domain_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Visibility</label>
          <div className="flex gap-2">
            {(['parent', 'staff_only'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={cn(
                  'rounded-[var(--radius)] border px-3 py-1.5 text-xs font-medium transition-colors',
                  visibility === v
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]'
                )}
              >
                {v === 'parent' ? 'Visible to parents' : 'Staff only'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !narrative.trim() || submitting}
            className="rounded-[var(--radius)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Observation'}
          </button>
        </div>
      </div>
    </div>
  )
}
