'use client'

import { useState } from 'react'
import { Shield, Plus, Building, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'

type DialogType = 'enroll' | 'add-agency' | 'generate-claim' | null

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export function SubsidyActions() {
  const [openDialog, setOpenDialog] = useState<DialogType>(null)

  // Enroll form state
  const [enrollStudentName, setEnrollStudentName] = useState('')
  const [enrollAgency, setEnrollAgency] = useState('')
  const [enrollCaseNumber, setEnrollCaseNumber] = useState('')
  const [enrollStartDate, setEnrollStartDate] = useState('')

  // Add Agency form state
  const [agencyName, setAgencyName] = useState('')
  const [agencyState, setAgencyState] = useState('')
  const [agencyEmail, setAgencyEmail] = useState('')

  // Generate Claim form state
  const [claimAgency, setClaimAgency] = useState('')
  const [claimMonth, setClaimMonth] = useState('')
  const [claimYear, setClaimYear] = useState('2026')

  function close() {
    setOpenDialog(null)
  }

  function resetEnroll() {
    setEnrollStudentName('')
    setEnrollAgency('')
    setEnrollCaseNumber('')
    setEnrollStartDate('')
  }

  function resetAgency() {
    setAgencyName('')
    setAgencyState('')
    setAgencyEmail('')
  }

  function resetClaim() {
    setClaimAgency('')
    setClaimMonth('')
    setClaimYear('2026')
  }

  function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault()
    alert(`Enrollment created for ${enrollStudentName} (Case #${enrollCaseNumber}) with ${enrollAgency}, starting ${enrollStartDate}`)
    resetEnroll()
    close()
  }

  function handleAddAgencySubmit(e: React.FormEvent) {
    e.preventDefault()
    alert(`Agency "${agencyName}" (${agencyState}) added. Contact: ${agencyEmail}`)
    resetAgency()
    close()
  }

  function handleGenerateClaimSubmit(e: React.FormEvent) {
    e.preventDefault()
    alert(`Claim generated for ${claimAgency} - ${claimMonth} ${claimYear}`)
    resetClaim()
    close()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Subsidies</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage state subsidy enrollments, claims, and reconciliation
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portal/admin/subsidies/agencies"
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Building className="h-4 w-4" /> Agencies
          </Link>
          <button
            type="button"
            onClick={() => setOpenDialog('add-agency')}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Building className="h-4 w-4" /> Add Agency
          </button>
          <button
            type="button"
            onClick={() => setOpenDialog('generate-claim')}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <FileText className="h-4 w-4" /> Generate Claim
          </button>
          <button
            type="button"
            onClick={() => setOpenDialog('enroll')}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Enroll
          </button>
        </div>
      </div>

      {/* Enroll Dialog */}
      <Dialog open={openDialog === 'enroll'} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Enroll Student in Subsidy"
          description="Create a new subsidy enrollment for a student."
        >
          <DialogClose onClick={close} />
          <form onSubmit={handleEnrollSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Student Name</label>
              <Input
                value={enrollStudentName}
                onChange={(e) => setEnrollStudentName(e.target.value)}
                placeholder="First Last"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Agency</label>
              <Input
                value={enrollAgency}
                onChange={(e) => setEnrollAgency(e.target.value)}
                placeholder="e.g. DHS, Head Start"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Case Number</label>
              <Input
                value={enrollCaseNumber}
                onChange={(e) => setEnrollCaseNumber(e.target.value)}
                placeholder="ABC-12345"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Start Date</label>
              <Input
                type="date"
                value={enrollStartDate}
                onChange={(e) => setEnrollStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>Cancel</Button>
              <Button type="submit" size="sm">Enroll</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Agency Dialog */}
      <Dialog open={openDialog === 'add-agency'} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Add Subsidy Agency"
          description="Register a new subsidy agency for enrollment tracking."
        >
          <DialogClose onClick={close} />
          <form onSubmit={handleAddAgencySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Agency Name</label>
              <Input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Department of Human Services"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">State</label>
              <Input
                value={agencyState}
                onChange={(e) => setAgencyState(e.target.value)}
                placeholder="e.g. Texas"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Contact Email</label>
              <Input
                type="email"
                value={agencyEmail}
                onChange={(e) => setAgencyEmail(e.target.value)}
                placeholder="contact@agency.gov"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>Cancel</Button>
              <Button type="submit" size="sm">Add Agency</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Claim Dialog */}
      <Dialog open={openDialog === 'generate-claim'} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Generate Subsidy Claim"
          description="Generate a claim for a specific agency and billing period."
        >
          <DialogClose onClick={close} />
          <form onSubmit={handleGenerateClaimSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Agency</label>
              <Input
                value={claimAgency}
                onChange={(e) => setClaimAgency(e.target.value)}
                placeholder="Select or type agency name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Month</label>
                <Select value={claimMonth} onChange={(e) => setClaimMonth(e.target.value)} required>
                  <option value="">Select month</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Year</label>
                <Select value={claimYear} onChange={(e) => setClaimYear(e.target.value)} required>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>Cancel</Button>
              <Button type="submit" size="sm">Generate Claim</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
