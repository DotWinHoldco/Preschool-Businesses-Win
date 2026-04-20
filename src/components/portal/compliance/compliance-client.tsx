'use client'

// @anchor: cca.compliance.compliance-client
// DFPS Compliance dashboard: scorecard, renewals, inspections

import { useState } from 'react'
import {
  FileText,
  GraduationCap,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InspectionRecord {
  id: string
  type: string
  date: string
  inspectorName: string
  result: 'pass' | 'fail' | 'conditional'
  notes: string
}

// ---------------------------------------------------------------------------
// Scorecard data
// ---------------------------------------------------------------------------

const SCORECARD = [
  {
    label: 'Required Documents',
    value: '18/22 present',
    pct: 82,
    icon: FileText,
    color: 'var(--color-primary)',
  },
  {
    label: 'Staff Training',
    value: '92% current',
    pct: 92,
    icon: GraduationCap,
    color: 'var(--color-success, #10B981)',
  },
  {
    label: 'Incident Reports (30d)',
    value: '2 filed',
    pct: null,
    icon: AlertTriangle,
    color: 'var(--color-warning)',
  },
  {
    label: 'Inspections Due',
    value: '1 upcoming (May 2026)',
    pct: null,
    icon: ClipboardCheck,
    color: 'var(--color-primary)',
  },
]

// ---------------------------------------------------------------------------
// Renewal items
// ---------------------------------------------------------------------------

type RenewalStatus = 'ok' | 'warning' | 'expired'

interface RenewalItem {
  id: string
  label: string
  detail: string
  status: RenewalStatus
}

const RENEWALS: RenewalItem[] = [
  { id: 'r1', label: 'State License', detail: 'Expires Jun 2027', status: 'ok' },
  { id: 'r2', label: 'Fire Inspection', detail: 'Due May 2026', status: 'warning' },
  { id: 'r3', label: 'CPR Certs (3 staff)', detail: 'Expires Apr 2026', status: 'warning' },
  { id: 'r4', label: 'Food Handler Permits', detail: 'Expires Aug 2026', status: 'ok' },
  { id: 'r5', label: 'Background Checks (2 new hires)', detail: 'Due Apr 2026', status: 'warning' },
]

const STATUS_CONFIG: Record<RenewalStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  ok: { icon: CheckCircle, color: 'var(--color-success, #10B981)', label: 'Current' },
  warning: { icon: Clock, color: 'var(--color-warning)', label: 'Due Soon' },
  expired: { icon: XCircle, color: 'var(--color-destructive)', label: 'Expired' },
}

// ---------------------------------------------------------------------------
// Initial inspection records
// ---------------------------------------------------------------------------

const INITIAL_INSPECTIONS: InspectionRecord[] = [
  { id: 'insp-1', type: 'DFPS Annual', date: '2025-11-12', inspectorName: 'Maria Gonzalez', result: 'pass', notes: 'All standards met. No corrective actions.' },
  { id: 'insp-2', type: 'Fire Marshal', date: '2025-09-05', inspectorName: 'James Burton', result: 'conditional', notes: 'Replace extinguisher in kitchen. Corrected same day.' },
  { id: 'insp-3', type: 'Health Dept.', date: '2025-06-20', inspectorName: 'Anita Patel', result: 'pass', notes: 'Kitchen and restrooms in compliance.' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComplianceClient() {
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS)
  const [showInspectionDialog, setShowInspectionDialog] = useState(false)
  const [inspForm, setInspForm] = useState({
    type: '',
    date: '',
    inspectorName: '',
    result: 'pass' as 'pass' | 'fail' | 'conditional',
    notes: '',
  })

  function handleAddInspection() {
    if (!inspForm.type || !inspForm.date || !inspForm.inspectorName) return
    const newRecord: InspectionRecord = {
      id: `insp-${Date.now()}`,
      ...inspForm,
    }
    setInspections((prev) => [newRecord, ...prev])
    setShowInspectionDialog(false)
    setInspForm({ type: '', date: '', inspectorName: '', result: 'pass', notes: '' })
  }

  const resultConfig: Record<string, { color: string; label: string }> = {
    pass: { color: 'var(--color-success, #10B981)', label: 'Pass' },
    fail: { color: 'var(--color-destructive)', label: 'Fail' },
    conditional: { color: 'var(--color-warning)', label: 'Conditional' },
  }

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* DFPS Compliance Scorecard                                         */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCORECARD.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-[var(--radius,0.75rem)] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: metric.color + '15' }}
                  >
                    <Icon size={20} style={{ color: metric.color }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                    {metric.label}
                  </p>
                </div>
                <p className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>
                  {metric.value}
                </p>
                {metric.pct !== null && (
                  <div className="mt-3">
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--color-muted)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${metric.pct}%`,
                          backgroundColor: metric.color,
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-muted-foreground)' }}>
                      {metric.pct}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ================================================================= */}
      {/* Upcoming Renewals                                                 */}
      {/* ================================================================= */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Renewals</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-[var(--radius,0.75rem)] border divide-y"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {RENEWALS.map((item) => {
              const cfg = STATUS_CONFIG[item.status]
              const StatusIcon = cfg.icon
              return (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <StatusIcon size={18} style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {item.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {item.detail}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0"
                    style={{
                      backgroundColor: cfg.color + '15',
                      color: cfg.color,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Link to DFPS Reports */}
          <div className="mt-4">
            <Button variant="secondary" asChild>
              <a href="/portal/admin/dfps-compliance">
                View DFPS Reports
                <ArrowRight size={14} />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Inspection Records                                                */}
      {/* ================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Inspection Records
          </h2>
          <Button variant="secondary" size="sm" onClick={() => setShowInspectionDialog(true)}>
            <Plus size={14} />
            Add Inspection
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-muted)' }}>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Date</th>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Type</th>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Inspector</th>
                    <th className="p-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Result</th>
                    <th className="p-3 text-left font-medium hidden sm:table-cell" style={{ color: 'var(--color-muted-foreground)' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((insp) => {
                    const rcfg = resultConfig[insp.result]
                    return (
                      <tr key={insp.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="p-3" style={{ color: 'var(--color-muted-foreground)' }}>
                          {new Date(insp.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {insp.type}
                        </td>
                        <td className="p-3" style={{ color: 'var(--color-muted-foreground)' }}>
                          {insp.inspectorName}
                        </td>
                        <td className="p-3">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: rcfg.color + '15', color: rcfg.color }}
                          >
                            {rcfg.label}
                          </span>
                        </td>
                        <td className="p-3 hidden sm:table-cell max-w-[240px] truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                          {insp.notes}
                        </td>
                      </tr>
                    )
                  })}
                  {inspections.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        No inspection records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add inspection dialog */}
      <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
        <DialogOverlay onClick={() => setShowInspectionDialog(false)} />
        <DialogContent title="Add Inspection Record">
          <DialogClose onClick={() => setShowInspectionDialog(false)} />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Type</label>
              <Input
                value={inspForm.type}
                onChange={(e) => setInspForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="e.g. DFPS Annual, Fire Marshal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Date</label>
              <Input
                type="date"
                value={inspForm.date}
                onChange={(e) => setInspForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Inspector Name</label>
              <Input
                value={inspForm.inspectorName}
                onChange={(e) => setInspForm((f) => ({ ...f, inspectorName: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Result</label>
              <select
                value={inspForm.result}
                onChange={(e) => setInspForm((f) => ({ ...f, result: e.target.value as 'pass' | 'fail' | 'conditional' }))}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-3 text-sm min-h-[48px]"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', backgroundColor: 'var(--color-background)' }}
              >
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Notes</label>
              <textarea
                value={inspForm.notes}
                onChange={(e) => setInspForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
                rows={3}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-3 text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', backgroundColor: 'var(--color-background)' }}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowInspectionDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!inspForm.type || !inspForm.date || !inspForm.inspectorName}
                onClick={handleAddInspection}
              >
                Save Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
