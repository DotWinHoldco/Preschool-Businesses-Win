'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit3 } from 'lucide-react'
export function AudienceEditButton({ audienceId }: { audienceId: string }) {
  return (
    <Link href={`/portal/admin/crm/audiences/${audienceId}/edit`}>
      <Button variant="secondary">
        <Edit3 size={14} />
        Edit
      </Button>
    </Link>
  )
}
