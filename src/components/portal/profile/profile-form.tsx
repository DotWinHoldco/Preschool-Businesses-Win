'use client'

// @anchor: cca.profile.form-client
// Client form component for the admin profile page.

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateProfile } from '@/lib/actions/profile/update-profile'

interface ProfileFormProps {
  initialName: string
  initialEmail: string
  initialPhone: string
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialPhone,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await updateProfile({ name, phone })

    if (result.ok) {
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } else {
      setMessage({
        type: 'error',
        text: result.error ?? 'Something went wrong.',
      })
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <label
          htmlFor="profile-name"
          className="block text-sm font-medium"
          style={{ color: 'var(--color-foreground)' }}
        >
          Name
        </label>
        <Input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <label
          htmlFor="profile-email"
          className="block text-sm font-medium"
          style={{ color: 'var(--color-foreground)' }}
        >
          Email
        </label>
        <Input
          id="profile-email"
          type="email"
          value={initialEmail}
          disabled
          readOnly
          className="cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-muted)',
            color: 'var(--color-muted-foreground)',
          }}
        />
        <p
          className="text-xs"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Email cannot be changed here.
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label
          htmlFor="profile-phone"
          className="block text-sm font-medium"
          style={{ color: 'var(--color-foreground)' }}
        >
          Phone
        </label>
        <Input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor:
              message.type === 'success'
                ? 'var(--color-success, #dcfce7)'
                : 'var(--color-destructive)',
            color:
              message.type === 'success'
                ? 'var(--color-success-foreground, #166534)'
                : 'var(--color-destructive-foreground)',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Save */}
      <Button type="submit" loading={saving} disabled={saving}>
        Save Changes
      </Button>
    </form>
  )
}
