'use client'

// @anchor: cca.camera.feed-viewer
// HLS video player placeholder for camera feeds
// See CCA_BUILD_BRIEF.md §14

import { useState } from 'react'
import { Camera, Maximize2, Bookmark, RefreshCw } from 'lucide-react'

interface CameraFeedViewerProps {
  cameraId: string
  cameraName: string
  streamUrl: string
  status: 'online' | 'offline' | 'error'
  onBookmark?: (label: string) => void
}

export function CameraFeedViewer({
  cameraName,
  streamUrl,
  status,
  onBookmark,
}: CameraFeedViewerProps) {
  const [bookmarkLabel] = useState('')

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
    >
      {/* Video area */}
      <div
        className="relative aspect-video flex items-center justify-center"
        style={{ backgroundColor: '#111' }}
      >
        {status === 'online' ? (
          <>
            {/* In production: HLS.js player using streamUrl */}
            <div className="text-center">
              <Camera size={48} style={{ color: '#555' }} />
              <p className="text-xs mt-2" style={{ color: '#888' }}>
                Live feed: {streamUrl}
              </p>
              <p className="text-[10px] mt-1" style={{ color: '#666' }}>
                HLS.js player renders here
              </p>
            </div>
            <div
              className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: 'var(--color-destructive)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-medium text-white">LIVE</span>
            </div>
          </>
        ) : (
          <div className="text-center">
            <Camera size={48} style={{ color: '#555' }} />
            <p className="text-xs mt-2" style={{ color: '#888' }}>
              Camera {status}
            </p>
          </div>
        )}
      </div>
      {/* Controls */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          {cameraName}
        </span>
        <div className="flex items-center gap-1">
          {onBookmark && (
            <button
              onClick={() => {
                if (bookmarkLabel) onBookmark(bookmarkLabel)
              }}
              className="rounded p-1.5 hover:bg-gray-100"
              style={{ color: 'var(--color-foreground)' }}
              aria-label="Bookmark"
            >
              <Bookmark size={14} />
            </button>
          )}
          <button
            className="rounded p-1.5 hover:bg-gray-100"
            style={{ color: 'var(--color-foreground)' }}
            aria-label="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="rounded p-1.5 hover:bg-gray-100"
            style={{ color: 'var(--color-foreground)' }}
            aria-label="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
