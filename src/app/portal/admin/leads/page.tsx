// @anchor: cca.crm.legacy-leads-redirect
// Leads have been unified into the contacts CRM. Bookmark-safe redirect
// preserves anyone landing on the old URL.

import { redirect } from 'next/navigation'

export default function LegacyLeadsPage() {
  redirect('/portal/admin/crm/contacts?stage=lead')
}
