'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { blockEmail } from '@/lib/actions/crm/suppressions'

export function ManualBlockForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [pending, start] = useTransition()

  function submit() {
    if (!email.trim()) return
    start(async () => {
      const r = await blockEmail({ email: email.trim(), notes: notes.trim() || undefined })
      if (!r.ok) {
        toast({ variant: 'error', title: r.error ?? 'Block failed' })
        return
      }
      toast({ variant: 'success', title: 'Email blocked' })
      setEmail('')
      setNotes('')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-2 flex-wrap">
        <Ban size={16} className="text-[var(--color-muted-foreground)]" />
        <span className="text-sm font-medium">Hard block an email</span>
        <Input
          inputSize="sm"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-64"
        />
        <Input
          inputSize="sm"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 min-w-[12rem]"
        />
        <Button onClick={submit} loading={pending} disabled={!email.trim() || pending}>
          Block
        </Button>
      </CardContent>
    </Card>
  )
}
