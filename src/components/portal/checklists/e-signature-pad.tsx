'use client'

// @anchor: cca.checklist.e-signature
// Signature capture pad component for e-signatures on checklist items
// See CCA_BUILD_BRIEF.md §34

import { useRef, useState, useEffect, useCallback } from 'react'
import { Eraser, Check } from 'lucide-react'

interface ESignaturePadProps {
  onSign: (signatureDataUrl: string) => void
  onClear?: () => void
  width?: number
  height?: number
  label?: string
}

export function ESignaturePad({
  onSign,
  onClear,
  width = 400,
  height = 200,
  label = 'Sign below',
}: ESignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up canvas for high-DPI
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#1A1A1A'
  }, [width, height])

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) {
        const touch = e.touches[0]
        if (!touch) return null
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    },
    [],
  )

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const pos = getPos(e)
      if (!pos) return
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      setIsDrawing(true)
      setHasSignature(true)
    },
    [getPos],
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return
      e.preventDefault()
      const pos = getPos(e)
      if (!pos) return
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    },
    [isDrawing, getPos],
  )

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onClear?.()
  }, [onClear])

  const confirmSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    const dataUrl = canvas.toDataURL('image/png')
    onSign(dataUrl)
  }, [hasSignature, onSign])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
        {label}
      </label>
      <div
        className="relative rounded-lg border-2 border-dashed overflow-hidden"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none"
          style={{ width, height }}
          aria-label="Signature pad"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Draw your signature here
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
        >
          <Eraser size={14} />
          Clear
        </button>
        <button
          type="button"
          onClick={confirmSignature}
          disabled={!hasSignature}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Check size={14} />
          Confirm Signature
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        By signing, you agree that this electronic signature is equivalent to your handwritten signature.
      </p>
    </div>
  )
}
