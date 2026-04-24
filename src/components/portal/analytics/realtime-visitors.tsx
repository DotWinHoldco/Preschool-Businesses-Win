'use client'

import { useEffect, useState } from 'react'

export function RealtimeVisitors() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function tick() {
      try {
        const res = await fetch('/api/analytics/realtime', {
          cache: 'no-store',
          credentials: 'include',
        })
        if (!res.ok) return
        const data = (await res.json()) as { active_visitors?: number }
        if (!cancelled) setCount(data.active_visitors ?? 0)
      } catch {
        // ignore
      }
    }
    tick()
    const id = setInterval(tick, 10_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            count && count > 0 ? 'animate-ping bg-emerald-500' : 'bg-slate-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            count && count > 0 ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
      </span>
      <span className="text-[var(--color-muted-foreground)]">
        {count === null ? 'Live' : `${count} on site now`}
      </span>
    </div>
  )
}
