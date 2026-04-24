// @anchor: cca.analytics.collect
// First-party analytics collector. Receives event batches from the browser
// snippet (/pbw-analytics.js) and from the PBW app itself for conversions.
// Shares an origin with the app so ad-blockers that match /analytics or
// /track paths leave it alone.

import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsBatchSchema, ConsentPayloadSchema } from '@/lib/analytics/schemas'
import { lookupSite, originAllowed } from '@/lib/analytics/site-lookup'
import { ingestBatch } from '@/lib/analytics/ingest'
import { hashIp } from '@/lib/analytics/ip-hash'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function corsHeaders(origin: string | null, allow: boolean): Record<string, string> {
  if (!allow || !origin) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function noStore(h: Record<string, string>): Record<string, string> {
  return { ...h, 'Cache-Control': 'no-store' }
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

function getGeo(req: NextRequest): {
  country: string | null
  region: string | null
  city: string | null
} {
  const country = req.headers.get('x-vercel-ip-country') ?? req.headers.get('cf-ipcountry') ?? null
  const region =
    req.headers.get('x-vercel-ip-country-region') ?? req.headers.get('cf-region') ?? null
  const cityRaw = req.headers.get('x-vercel-ip-city') ?? req.headers.get('cf-ipcity') ?? null
  const city = cityRaw ? decodeURIComponent(cityRaw) : null
  return { country, region, city }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  // Cannot look up the site without a body, so allow preflight for any origin.
  // The POST handler enforces the origin against the resolved site.
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin ?? '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const ip = getIp(request)

  // IP-keyed rate limit: generous — 600 events/min per IP (≈ 10 per sec).
  // The snippet batches and throttles client-side.
  const rl = rateLimit('analytics:' + ip, 600)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: noStore(corsHeaders(origin, true)) },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: noStore(corsHeaders(origin, true)) },
    )
  }

  const parsed = AnalyticsBatchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues.slice(0, 5) },
      { status: 400, headers: noStore(corsHeaders(origin, true)) },
    )
  }

  const site = await lookupSite(parsed.data.site_key)
  if (!site) {
    return NextResponse.json(
      { error: 'unknown_site' },
      { status: 404, headers: noStore(corsHeaders(origin, true)) },
    )
  }

  // Allow same-origin posts (from the PBW app itself) even if origin isn't
  // in site.origins — needed for server-side conversion emits via fetch.
  const isSameOrigin = !origin || origin === request.nextUrl.origin
  if (!isSameOrigin && !originAllowed(site, origin)) {
    return NextResponse.json(
      { error: 'origin_not_allowed' },
      { status: 403, headers: noStore(corsHeaders(origin, false)) },
    )
  }

  const geo = getGeo(request)
  const userAgent = request.headers.get('user-agent')

  const result = await ingestBatch(parsed.data, {
    site,
    ip,
    user_agent: userAgent,
    country: geo.country,
    region: geo.region,
    city: geo.city,
  })

  return NextResponse.json(
    { ok: true, ...result },
    { status: 200, headers: noStore(corsHeaders(origin, true)) },
  )
}

// Consent endpoint piggybacks on the same route via PUT. Lets us log
// grant/deny/withdraw events with the same CORS contract.
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin')

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: noStore(corsHeaders(origin, true)) },
    )
  }

  const parsed = ConsentPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload' },
      { status: 400, headers: noStore(corsHeaders(origin, true)) },
    )
  }

  const site = await lookupSite(parsed.data.site_key)
  if (!site) {
    return NextResponse.json(
      { error: 'unknown_site' },
      { status: 404, headers: noStore(corsHeaders(origin, true)) },
    )
  }

  const isSameOrigin = !origin || origin === request.nextUrl.origin
  if (!isSameOrigin && !originAllowed(site, origin)) {
    return NextResponse.json(
      { error: 'origin_not_allowed' },
      { status: 403, headers: noStore(corsHeaders(origin, false)) },
    )
  }

  const ip = getIp(request)
  const ipHash = await hashIp(ip)

  const supabase = createAdminClient()
  await supabase.from('analytics_consent').insert({
    tenant_id: site.tenant_id,
    visitor_id: parsed.data.visitor_id,
    status: parsed.data.status,
    ip_hash: ipHash,
    user_agent: request.headers.get('user-agent'),
    page_url: parsed.data.page_url ?? null,
  })

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: noStore(corsHeaders(origin, true)) },
  )
}
