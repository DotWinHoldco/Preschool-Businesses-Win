'use server'

// @anchor: cca.daily-report.publish
// Publish a daily report — makes it visible to parents and triggers notification.

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { PublishReportSchema } from '@/lib/schemas/daily-report'

export type PublishReportState = {
  ok: boolean
  error?: string
}

export async function publishReport(
  _prev: PublishReportState,
  formData: FormData,
): Promise<PublishReportState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = PublishReportSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { report_id } = parsed.data
    const headerStore = await headers()
    void headerStore // ensure headers() is consumed for tenant context

    const supabase = await createTenantServerClient()

    // Check report exists and is in draft
    const { data: report, error: fetchErr } = await supabase
      .from('daily_reports')
      .select('id, status, student_id')
      .eq('id', report_id)
      .single()

    if (fetchErr || !report) {
      return { ok: false, error: 'Report not found' }
    }

    if (report.status === 'published') {
      return { ok: false, error: 'Report is already published' }
    }

    // Update status to published
    const { error: updateErr } = await supabase
      .from('daily_reports')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', report_id)

    if (updateErr) {
      return { ok: false, error: updateErr.message }
    }

    // TODO: Trigger push notification to parents
    // await sendNotification({
    //   template: 'daily_report_published',
    //   payload: { student_id: report.student_id, report_id },
    //   channels: ['push', 'in_app'],
    // })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
