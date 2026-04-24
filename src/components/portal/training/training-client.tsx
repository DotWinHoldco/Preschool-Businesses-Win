'use client'

// @anchor: cca.training.training-client
// Staff training matrix with status tracking, add requirement, record completion

import { useState, useMemo, useCallback } from 'react'
import { Plus, Award, Search, Upload, Filter } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrainingStatus = 'current' | 'expiring' | 'expired'
type Cadence = 'one_time' | 'annual' | 'every_6_months' | 'every_3_months'
type StatusFilter = 'all' | 'current' | 'expiring' | 'expired'

interface Training {
  id: string
  title: string
  cadence: Cadence
  requiredHours: number
  requiredForRoles: string[]
}

interface StaffMember {
  id: string
  name: string
  role: string
}

interface CompletionRecord {
  staffId: string
  trainingId: string
  completionDate: string
  expiryDate: string | null
  hours: number
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ROLES = ['Lead Teacher', 'Assistant Teacher', 'Director', 'Cook']

const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', name: 'Jane Smith', role: 'Lead Teacher' },
  { id: 's2', name: 'Maria Garcia', role: 'Assistant Teacher' },
  { id: 's3', name: 'Tom Wilson', role: 'Director' },
  { id: 's4', name: 'Sarah Johnson', role: 'Lead Teacher' },
]

const INITIAL_TRAININGS: Training[] = [
  {
    id: 'tr1',
    title: 'CPR/First Aid',
    cadence: 'annual',
    requiredHours: 8,
    requiredForRoles: ['Lead Teacher', 'Assistant Teacher', 'Director', 'Cook'],
  },
  {
    id: 'tr2',
    title: 'Mandated Reporter',
    cadence: 'annual',
    requiredHours: 2,
    requiredForRoles: ['Lead Teacher', 'Assistant Teacher', 'Director'],
  },
  {
    id: 'tr3',
    title: 'Food Safety',
    cadence: 'every_6_months',
    requiredHours: 4,
    requiredForRoles: ['Cook', 'Lead Teacher'],
  },
  {
    id: 'tr4',
    title: 'Child Development',
    cadence: 'one_time',
    requiredHours: 12,
    requiredForRoles: ['Lead Teacher', 'Assistant Teacher'],
  },
]

// Relative to today = 2026-04-20
const INITIAL_COMPLETIONS: CompletionRecord[] = [
  // Jane Smith
  {
    staffId: 's1',
    trainingId: 'tr1',
    completionDate: '2025-06-15',
    expiryDate: '2026-06-15',
    hours: 8,
  },
  {
    staffId: 's1',
    trainingId: 'tr2',
    completionDate: '2025-09-01',
    expiryDate: '2026-09-01',
    hours: 2,
  },
  {
    staffId: 's1',
    trainingId: 'tr3',
    completionDate: '2026-02-01',
    expiryDate: '2026-08-01',
    hours: 4,
  },
  { staffId: 's1', trainingId: 'tr4', completionDate: '2024-01-10', expiryDate: null, hours: 12 },
  // Maria Garcia
  {
    staffId: 's2',
    trainingId: 'tr1',
    completionDate: '2025-05-01',
    expiryDate: '2026-05-01',
    hours: 8,
  }, // expiring
  {
    staffId: 's2',
    trainingId: 'tr2',
    completionDate: '2025-03-01',
    expiryDate: '2026-03-01',
    hours: 2,
  }, // expired
  { staffId: 's2', trainingId: 'tr4', completionDate: '2024-06-15', expiryDate: null, hours: 12 },
  // Tom Wilson
  {
    staffId: 's3',
    trainingId: 'tr1',
    completionDate: '2025-08-20',
    expiryDate: '2026-08-20',
    hours: 8,
  },
  {
    staffId: 's3',
    trainingId: 'tr2',
    completionDate: '2026-01-10',
    expiryDate: '2027-01-10',
    hours: 2,
  },
  // Sarah Johnson
  {
    staffId: 's4',
    trainingId: 'tr1',
    completionDate: '2025-02-01',
    expiryDate: '2026-02-01',
    hours: 8,
  }, // expired
  {
    staffId: 's4',
    trainingId: 'tr2',
    completionDate: '2026-04-01',
    expiryDate: '2027-04-01',
    hours: 2,
  },
  { staffId: 's4', trainingId: 'tr4', completionDate: '2025-03-10', expiryDate: null, hours: 12 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = '2026-04-20'

function getStatus(completion: CompletionRecord | undefined, cadence: Cadence): TrainingStatus {
  if (!completion) return 'expired' // never completed = treated as missing
  if (cadence === 'one_time') return 'current'
  if (!completion.expiryDate) return 'current'
  const exp = new Date(completion.expiryDate)
  const now = new Date(TODAY)
  if (exp < now) return 'expired'
  const thirtyDaysOut = new Date(now)
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)
  if (exp <= thirtyDaysOut) return 'expiring'
  return 'current'
}

const _STATUS_COLORS: Record<TrainingStatus, string> = {
  current: 'var(--color-success)',
  expiring: 'var(--color-warning)',
  expired: 'var(--color-destructive)',
}

const STATUS_BG: Record<TrainingStatus, string> = {
  current: 'var(--color-success)',
  expiring: 'var(--color-warning)',
  expired: 'var(--color-destructive)',
}

const CADENCE_LABELS: Record<Cadence, string> = {
  one_time: 'One-time',
  annual: 'Annual',
  every_6_months: 'Every 6 months',
  every_3_months: 'Every 3 months',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrainingClient() {
  const [staff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [trainings, setTrainings] = useState<Training[]>(INITIAL_TRAININGS)
  const [completions, setCompletions] = useState<CompletionRecord[]>(INITIAL_COMPLETIONS)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  // Dialogs
  const [showAddReq, setShowAddReq] = useState(false)
  const [showRecordComp, setShowRecordComp] = useState(false)

  // Add requirement form
  const [reqTitle, setReqTitle] = useState('')
  const [reqCadence, setReqCadence] = useState<Cadence>('annual')
  const [reqHours, setReqHours] = useState('')
  const [reqRoles, setReqRoles] = useState<string[]>([])

  // Record completion form
  const [compStaffId, setCompStaffId] = useState('')
  const [compTrainingId, setCompTrainingId] = useState('')
  const [compDate, setCompDate] = useState(TODAY)
  const [compHours, setCompHours] = useState('')

  // Build matrix data
  const matrixData = useMemo(() => {
    return staff.map((s) => {
      const cells = trainings.map((t) => {
        const comp = completions.find((c) => c.staffId === s.id && c.trainingId === t.id)
        const status = getStatus(comp, t.cadence)
        return { training: t, completion: comp, status }
      })
      return { staff: s, cells }
    })
  }, [staff, trainings, completions])

  // Filter
  const filteredData = useMemo(() => {
    let data = matrixData
    const q = search.toLowerCase().trim()
    if (q) {
      data = data.filter((row) => row.staff.name.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => row.cells.some((c) => c.status === statusFilter))
    }
    return data
  }, [matrixData, search, statusFilter])

  const handleAddRequirement = useCallback(() => {
    if (!reqTitle.trim() || reqRoles.length === 0) return
    const training: Training = {
      id: crypto.randomUUID(),
      title: reqTitle.trim(),
      cadence: reqCadence,
      requiredHours: Number(reqHours) || 0,
      requiredForRoles: reqRoles,
    }
    setTrainings((prev) => [...prev, training])
    setShowAddReq(false)
    setReqTitle('')
    setReqCadence('annual')
    setReqHours('')
    setReqRoles([])
  }, [reqTitle, reqCadence, reqHours, reqRoles])

  const handleRecordCompletion = useCallback(() => {
    if (!compStaffId || !compTrainingId || !compDate) return
    const training = trainings.find((t) => t.id === compTrainingId)
    if (!training) return
    let expiryDate: string | null = null
    if (training.cadence !== 'one_time') {
      const d = new Date(compDate)
      switch (training.cadence) {
        case 'annual':
          d.setFullYear(d.getFullYear() + 1)
          break
        case 'every_6_months':
          d.setMonth(d.getMonth() + 6)
          break
        case 'every_3_months':
          d.setMonth(d.getMonth() + 3)
          break
      }
      expiryDate = d.toISOString().split('T')[0]
    }
    const record: CompletionRecord = {
      staffId: compStaffId,
      trainingId: compTrainingId,
      completionDate: compDate,
      expiryDate,
      hours: Number(compHours) || 0,
    }
    // Replace existing or add new
    setCompletions((prev) => {
      const idx = prev.findIndex(
        (c) => c.staffId === compStaffId && c.trainingId === compTrainingId,
      )
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = record
        return copy
      }
      return [...prev, record]
    })
    setShowRecordComp(false)
    setCompStaffId('')
    setCompTrainingId('')
    setCompDate(TODAY)
    setCompHours('')
  }, [compStaffId, compTrainingId, compDate, compHours, trainings])

  const toggleRole = (role: string) => {
    setReqRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="pl-9"
            inputSize="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--color-muted-foreground)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          >
            <option value="all">All statuses</option>
            <option value="current">Current</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={() => setShowAddReq(true)}>
            <Plus size={16} />
            Add Requirement
          </Button>
          <Button size="sm" onClick={() => setShowRecordComp(true)}>
            <Award size={16} />
            Record Completion
          </Button>
        </div>
      </div>

      {/* Matrix */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="sticky left-0 bg-[var(--color-card)] px-4 py-3 text-left font-semibold text-[var(--color-foreground)] z-10">
                    Staff
                  </th>
                  {trainings.map((t) => (
                    <th
                      key={t.id}
                      className="px-4 py-3 text-center font-semibold text-[var(--color-foreground)] min-w-[140px]"
                    >
                      <div>{t.title}</div>
                      <div className="text-xs font-normal text-[var(--color-muted-foreground)]">
                        {CADENCE_LABELS[t.cadence]} &middot; {t.requiredHours}h
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr
                    key={row.staff.id}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="sticky left-0 bg-[var(--color-card)] px-4 py-3 z-10">
                      <p className="font-medium text-[var(--color-foreground)]">{row.staff.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {row.staff.role}
                      </p>
                    </td>
                    {row.cells.map((cell) => {
                      const applicable = cell.training.requiredForRoles.includes(row.staff.role)
                      if (!applicable) {
                        return (
                          <td key={cell.training.id} className="px-4 py-3 text-center">
                            <span className="text-xs text-[var(--color-muted-foreground)]">
                              N/A
                            </span>
                          </td>
                        )
                      }
                      return (
                        <td key={cell.training.id} className="px-4 py-3 text-center">
                          <div
                            className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: STATUS_BG[cell.status] }}
                          >
                            {cell.status === 'current' && 'Current'}
                            {cell.status === 'expiring' && 'Expiring'}
                            {cell.status === 'expired' && (cell.completion ? 'Expired' : 'Missing')}
                          </div>
                          {cell.completion && (
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                              {cell.completion.expiryDate
                                ? `Exp: ${cell.completion.expiryDate}`
                                : 'No expiry'}
                            </p>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={trainings.length + 1}
                      className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                    >
                      No matching staff found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Requirement Dialog */}
      <Dialog open={showAddReq} onOpenChange={setShowAddReq}>
        <DialogOverlay onClick={() => setShowAddReq(false)} />
        <DialogContent title="Add Training Requirement">
          <DialogClose onClick={() => setShowAddReq(false)} />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Title
              </label>
              <Input
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g., Allergy Awareness"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Required for Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      reqRoles.includes(role)
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Cadence
                </label>
                <select
                  value={reqCadence}
                  onChange={(e) => setReqCadence(e.target.value as Cadence)}
                  className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] min-h-[48px]"
                >
                  <option value="one_time">One-time</option>
                  <option value="annual">Annual</option>
                  <option value="every_6_months">Every 6 months</option>
                  <option value="every_3_months">Every 3 months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Required Hours
                </label>
                <Input
                  type="number"
                  min={0}
                  value={reqHours}
                  onChange={(e) => setReqHours(e.target.value)}
                  placeholder="e.g., 4"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddReq(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddRequirement}
                disabled={!reqTitle.trim() || reqRoles.length === 0}
              >
                Add Requirement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Completion Dialog */}
      <Dialog open={showRecordComp} onOpenChange={setShowRecordComp}>
        <DialogOverlay onClick={() => setShowRecordComp(false)} />
        <DialogContent title="Record Training Completion">
          <DialogClose onClick={() => setShowRecordComp(false)} />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Staff Member
              </label>
              <select
                value={compStaffId}
                onChange={(e) => setCompStaffId(e.target.value)}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] min-h-[48px]"
              >
                <option value="">Select staff...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Training
              </label>
              <select
                value={compTrainingId}
                onChange={(e) => setCompTrainingId(e.target.value)}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] min-h-[48px]"
              >
                <option value="">Select training...</option>
                {trainings.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Completion Date
                </label>
                <Input type="date" value={compDate} onChange={(e) => setCompDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Hours
                </label>
                <Input
                  type="number"
                  min={0}
                  value={compHours}
                  onChange={(e) => setCompHours(e.target.value)}
                  placeholder="e.g., 8"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Certificate Upload
              </label>
              <div className="flex items-center gap-3 rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-6 text-center">
                <Upload size={20} className="text-[var(--color-muted-foreground)] mx-auto" />
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  Certificate upload placeholder
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowRecordComp(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRecordCompletion}
                disabled={!compStaffId || !compTrainingId || !compDate}
              >
                Record Completion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
