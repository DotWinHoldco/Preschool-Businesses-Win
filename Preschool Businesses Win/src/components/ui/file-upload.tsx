'use client'

import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type InputHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'
import { ProgressBar } from './progress-bar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileUploadProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /** Allowed MIME types (e.g., ["image/png", "image/jpeg"]) */
  acceptTypes?: string[]
  /** Max file size in bytes */
  maxSize?: number
  onChange?: (files: File[]) => void
  /** External progress (0-100) */
  progress?: number
  /** Preview for image files */
  showPreview?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      acceptTypes,
      maxSize,
      onChange,
      progress,
      showPreview = true,
      multiple = false,
      className,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [dragging, setDragging] = useState(false)
    const [previews, setPreviews] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const validate = (files: File[]): File[] => {
      setError(null)
      const valid: File[] = []
      for (const f of files) {
        if (acceptTypes && !acceptTypes.some((t) => f.type.match(t.replace('*', '.*')))) {
          setError(`File type not allowed: ${f.type}`)
          continue
        }
        if (maxSize && f.size > maxSize) {
          setError(`File too large: ${(f.size / 1024 / 1024).toFixed(1)}MB (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`)
          continue
        }
        valid.push(f)
      }
      return valid
    }

    const handleFiles = (files: File[]) => {
      const valid = validate(files)
      if (valid.length === 0) return

      // Generate image previews
      if (showPreview) {
        const urls: string[] = []
        valid.forEach((f) => {
          if (f.type.startsWith('image/')) {
            urls.push(URL.createObjectURL(f))
          }
        })
        setPreviews(urls)
      }

      onChange?.(valid)
    }

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      setDragging(true)
    }

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
    }

    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(Array.from(e.dataTransfer.files))
    }

    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius,0.75rem)] border-2 border-dashed p-6 text-center transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
            dragging
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]/50',
          )}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-muted-foreground)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <span className="font-medium text-[var(--color-primary)]">Click to upload</span> or
            drag and drop
          </p>
          {acceptTypes && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {acceptTypes.join(', ')}
            </p>
          )}
          {maxSize && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Max {(maxSize / 1024 / 1024).toFixed(0)}MB
            </p>
          )}
        </div>

        <input
          ref={setRef}
          type="file"
          className="sr-only"
          accept={acceptTypes?.join(',')}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files))
          }}
          {...props}
        />

        {error && (
          <p role="alert" className="text-sm text-[var(--color-destructive)]">
            {error}
          </p>
        )}

        {typeof progress === 'number' && progress > 0 && (
          <ProgressBar value={progress} showPercentage />
        )}

        {showPreview && previews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {previews.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Preview ${i + 1}`}
                className="h-20 w-20 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] object-cover"
              />
            ))}
          </div>
        )}
      </div>
    )
  },
)

FileUpload.displayName = 'FileUpload'

export { FileUpload }
