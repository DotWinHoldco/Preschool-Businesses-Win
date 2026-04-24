import { z } from 'zod'

const trimmedOrNull = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))

const urlString = z
  .string()
  .trim()
  .regex(/^https?:\/\/[^\s/]+(\/.*)?$/, 'Must be a valid https URL')

export const AnalyticsSiteUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  origins: z.array(urlString).max(10).default([]),
  is_active: z.boolean().default(true),
  meta_pixel_id: trimmedOrNull(64),
  meta_capi_token: trimmedOrNull(1024),
  meta_test_event_code: trimmedOrNull(32),
  ga4_measurement_id: trimmedOrNull(32),
  ga4_api_secret: trimmedOrNull(128),
  tiktok_pixel_id: trimmedOrNull(64),
  tiktok_access_token: trimmedOrNull(512),
})

export type AnalyticsSiteUpdate = z.infer<typeof AnalyticsSiteUpdateSchema>
