const WINDOW_MS = 60_000

const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(ip: string, limit: number): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { ok: false, remaining: 0 }
  }
  return { ok: true, remaining: limit - entry.count }
}

// Prevent memory leak: clean expired entries every 5 minutes
const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [key, val] of hits) {
    if (now > val.resetAt) hits.delete(key)
  }
}, 300_000)
if (typeof cleanup.unref === 'function') cleanup.unref()
