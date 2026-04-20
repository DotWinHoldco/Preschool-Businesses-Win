'use client'

// @anchor: cca.leads.admin-page-client
import { useState } from 'react'
import { UserPlus, Plus } from 'lucide-react'
import { LeadPipeline } from '@/components/portal/enrollment/lead-pipeline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'

interface Lead {
  id: string
  parent_first_name: string
  parent_last_name: string
  parent_email: string | null
  parent_phone: string | null
  child_name: string | null
  program_interest: string | null
  status: string
  priority: string
  source: string
  created_at: string
}

const SOURCES = ['website', 'referral', 'walk-in', 'social media'] as const
const PRIORITIES = ['hot', 'warm', 'cold'] as const

interface LeadsPageClientProps {
  initialLeads: Lead[]
}

export function LeadsPageClient({ initialLeads }: LeadsPageClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [source, setSource] = useState<string>('website')
  const [priority, setPriority] = useState<string>('warm')

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setChildName('')
    setSource('website')
    setPriority('warm')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    const newLead: Lead = {
      id: `local-${Date.now()}`,
      parent_first_name: firstName.trim(),
      parent_last_name: lastName.trim(),
      parent_email: email.trim() || null,
      parent_phone: phone.trim() || null,
      child_name: childName.trim() || null,
      program_interest: null,
      status: 'new',
      priority,
      source,
      created_at: new Date().toISOString(),
    }

    setLeads((prev) => [newLead, ...prev])
    resetForm()
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Lead Pipeline</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Track and manage enrollment leads from inquiry to enrollment
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <LeadPipeline leads={leads} />

      {/* Add Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent title="Add New Lead" description="Enter parent and child information to create a new enrollment lead.">
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  First Name *
                </label>
                <Input
                  inputSize="sm"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Parent first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Last Name *
                </label>
                <Input
                  inputSize="sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Parent last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Email
              </label>
              <Input
                inputSize="sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Phone
              </label>
              <Input
                inputSize="sm"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Child Name
              </label>
              <Input
                inputSize="sm"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Child's name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { resetForm(); setDialogOpen(false) }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
