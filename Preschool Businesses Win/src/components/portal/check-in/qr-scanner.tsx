'use client'

// @anchor: cca.checkin.qr-scanner
// QR code display for parent's phone — shows large QR per child.
// Uses the qrcode npm package to generate QR from student's qr_token.
// If parent has multiple children, renders swipeable cards.
// See CCA_BUILD_BRIEF.md §7

import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { cn } from '@/lib/cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface QRStudent {
  student_id: string
  student_name: string
  qr_token: string
  classroom_name: string | null
  photo_path: string | null
}

interface QRScannerProps {
  students: QRStudent[]
  className?: string
}

export function QRScanner({ students, className }: QRScannerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const current = students[activeIndex]

  const generateQR = useCallback(async (token: string) => {
    try {
      const url = await QRCode.toDataURL(token, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1C1C28',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      })
      setQrDataUrl(url)
    } catch {
      setQrDataUrl(null)
    }
  }, [])

  useEffect(() => {
    if (current?.qr_token) {
      generateQR(current.qr_token)
    }
  }, [current?.qr_token, generateQR])

  const goNext = () => {
    setActiveIndex((i) => Math.min(i + 1, students.length - 1))
  }

  const goPrev = () => {
    setActiveIndex((i) => Math.max(i - 1, 0))
  }

  if (students.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <p className="text-[var(--color-muted-foreground)]">
          No children found. Contact the school to set up QR codes.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* Student name + classroom */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
          {current.student_name}
        </h2>
        {current.classroom_name && (
          <p className="mt-1 text-[var(--color-muted-foreground)]">
            {current.classroom_name}
          </p>
        )}
      </div>

      {/* QR Code display */}
      <div className="rounded-[var(--radius,0.75rem)] border-2 border-[var(--color-border)] bg-white p-6 shadow-lg">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code for ${current.student_name}`}
            width={280}
            height={280}
            className="block"
          />
        ) : (
          <div className="flex h-[280px] w-[280px] items-center justify-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Generating QR code...
            </p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <p className="text-sm text-[var(--color-muted-foreground)]">
        Show this code to staff at the check-in station
      </p>

      {/* Swipe navigation for multiple children */}
      {students.length > 1 && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              'border border-[var(--color-border)] transition-colors',
              'disabled:opacity-30',
              'hover:bg-[var(--color-muted)]',
            )}
            aria-label="Previous child"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {students.map((s, i) => (
              <button
                key={s.student_id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'h-3 w-3 rounded-full transition-colors',
                  i === activeIndex
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-border)]',
                )}
                aria-label={`Show QR for ${s.student_name}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === students.length - 1}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              'border border-[var(--color-border)] transition-colors',
              'disabled:opacity-30',
              'hover:bg-[var(--color-muted)]',
            )}
            aria-label="Next child"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
