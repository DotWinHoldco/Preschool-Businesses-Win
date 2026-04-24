'use client'

// @anchor: cca.staff.profile-editor

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { saveStaffProfile } from '@/lib/actions/staff/admin-actions'

type EmploymentType = 'full_time' | 'part_time' | 'substitute'

type Props = {
  staffId: string
  profile: {
    employment_type: EmploymentType | null
    hourly_rate_cents: number | null
    bio: string | null
  }
}

export function ProfileEditor({ staffId, profile }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [employment, setEmployment] = useState<EmploymentType>(
    profile.employment_type ?? 'full_time',
  )
  const [hourlyRate, setHourlyRate] = useState(
    profile.hourly_rate_cents != null ? String((profile.hourly_rate_cents / 100).toFixed(2)) : '',
  )
  const [bio, setBio] = useState(profile.bio ?? '')
  const [err, setErr] = useState<string | null>(null)

  const submit = () => {
    setErr(null)
    const cents = hourlyRate === '' ? null : Math.round(Number(hourlyRate) * 100)
    if (cents !== null && !Number.isFinite(cents)) {
      setErr('Hourly rate must be a number.')
      return
    }
    startTransition(async () => {
      const res = await saveStaffProfile(staffId, {
        employment_type: employment,
        hourly_rate: cents,
        bio: bio || null,
      })
      if (!res.ok) setErr(res.error ?? 'Failed')
      else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Edit Profile
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent title="Edit Staff Profile" className="max-w-md">
          <DialogClose onClick={() => setOpen(false)} />
          <div className="space-y-3">
            <label className="block">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Employment type
              </span>
              <select
                value={employment}
                onChange={(e) => setEmployment(e.target.value as EmploymentType)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="substitute">Substitute</option>
              </select>
            </label>
            <label className="block">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Hourly rate ($)
              </span>
              <input
                inputMode="decimal"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
              />
            </label>
            <label className="block">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Bio
              </span>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
              />
            </label>
            {err && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                {err}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={isPending}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
