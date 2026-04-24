import { z } from 'zod'

export const AnalyticsEventTypeSchema = z.enum([
  'page_view',
  'click',
  'conversion',
  'session_start',
  'session_end',
  'custom',
  'error',
])

export const AnalyticsEventSchema = z.object({
  event_id: z.string().min(1).max(64),
  event_type: AnalyticsEventTypeSchema,
  event_name: z.string().min(1).max(64),
  visitor_id: z.string().min(1).max(64),
  session_id: z.string().min(1).max(64),
  client_ts: z.number().int().positive().optional(),
  page_url: z.string().max(2000).optional().nullable(),
  page_path: z.string().max(500).optional().nullable(),
  page_title: z.string().max(500).optional().nullable(),
  referrer: z.string().max(2000).optional().nullable(),
  utm_source: z.string().max(200).optional().nullable(),
  utm_medium: z.string().max(200).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable(),
  utm_content: z.string().max(200).optional().nullable(),
  utm_term: z.string().max(200).optional().nullable(),
  fbclid: z.string().max(500).optional().nullable(),
  gclid: z.string().max(500).optional().nullable(),
  ttclid: z.string().max(500).optional().nullable(),
  screen_width: z.number().int().positive().optional().nullable(),
  screen_height: z.number().int().positive().optional().nullable(),
  viewport_width: z.number().int().positive().optional().nullable(),
  viewport_height: z.number().int().positive().optional().nullable(),
  language: z.string().max(16).optional().nullable(),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
})

export const AnalyticsBatchSchema = z.object({
  site_key: z.string().min(8).max(64),
  visitor_attribution: z
    .object({
      _av: z.string().max(64).optional().nullable(),
    })
    .optional(),
  events: z.array(AnalyticsEventSchema).min(1).max(50),
})

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>
export type AnalyticsBatch = z.infer<typeof AnalyticsBatchSchema>

export const ConsentPayloadSchema = z.object({
  site_key: z.string().min(8).max(64),
  visitor_id: z.string().min(1).max(64),
  status: z.enum(['granted', 'denied', 'withdrawn']),
  page_url: z.string().max(2000).optional().nullable(),
})

export type ConsentPayload = z.infer<typeof ConsentPayloadSchema>
