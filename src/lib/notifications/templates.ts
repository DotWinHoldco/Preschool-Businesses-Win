type TemplateResult = { title: string; body: string }

const templates: Record<string, (payload: Record<string, unknown>) => TemplateResult> = {
  ratio_violation: (p) => ({
    title: 'Ratio Violation Alert',
    body: `${p.classroom_name} has ${p.student_count} students with ${p.staff_count} staff — exceeds the required ${p.required_ratio} ratio.`,
  }),
  cert_expiring: (p) => ({
    title: `Certification Expiring${p.days_remaining ? ` in ${p.days_remaining} days` : ''}`,
    body: `${p.staff_name}'s ${p.cert_type} certification expires on ${p.expiry_date}.`,
  }),
  late_pickup: (p) => ({
    title: 'Late Pickup Alert',
    body: `${p.student_name} has not been picked up. School closed at ${p.closing_time}.`,
  }),
  document_expiring: (p) => ({
    title: `Document Expiring${p.days_remaining ? ` in ${p.days_remaining} days` : ''}`,
    body: `${p.document_name} for ${p.entity_name} expires on ${p.expiry_date}.`,
  }),
  invoice_generated: (p) => ({
    title: 'New Invoice Available',
    body: `Your invoice for ${p.period} is ready. Amount due: $${p.amount}.`,
  }),
  payment_received: (p) => ({
    title: 'Payment Received',
    body: `Payment of $${p.amount} for invoice ${p.invoice_number} has been received.`,
  }),
  payment_failed: (p) => ({
    title: 'Payment Failed',
    body: `Payment of $${p.amount} for invoice ${p.invoice_number} could not be processed.`,
  }),
  scheduled_message: (p) => ({
    title: 'New Message',
    body: `${p.sender_name}: ${String(p.preview ?? '').slice(0, 100)}`,
  }),
  attendance_finalized: (p) => ({
    title: 'Attendance Finalized',
    body: `Attendance for ${p.date} has been finalized. ${p.present_count} present, ${p.absent_count} absent.`,
  }),
  digest: (p) => ({
    title: 'Daily Summary',
    body: `You have ${p.unread_count} unread notification${Number(p.unread_count) === 1 ? '' : 's'}.`,
  }),
}

export function getNotificationText(
  template: string,
  payload: Record<string, unknown>,
): TemplateResult {
  const fn = templates[template]
  if (!fn) {
    return {
      title: template.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      body: JSON.stringify(payload),
    }
  }
  return fn(payload)
}
