// @anchor: cca.audit.log-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Audit Log | Admin Portal',
  description: 'Immutable record of all system actions and state changes',
}

export default function AdminAuditLogPage() {
  const mockEntries = [
    { id: '1', timestamp: '2026-04-08 14:32:05', actor: 'Sarah Johnson', action: 'check_in.create', entity: 'Student: Sophia Martinez', details: 'QR scan check-in, health screening passed', ip: '192.168.1.45' },
    { id: '2', timestamp: '2026-04-08 14:28:12', actor: 'Admin (Skylar)', action: 'student.update', entity: 'Student: Liam Chen', details: 'Updated allergy: added peanut (severe)', ip: '192.168.1.10' },
    { id: '3', timestamp: '2026-04-08 14:15:00', actor: 'System', action: 'ratio_check.run', entity: 'Classroom: Butterfly Room', details: '12 students / 2 staff = 6:1 (required 10:1) - Compliant', ip: '—' },
    { id: '4', timestamp: '2026-04-08 13:58:44', actor: 'Emily Davis', action: 'daily_report.publish', entity: 'Classroom: Sunshine Room', details: 'Published 15 student reports', ip: '192.168.1.52' },
    { id: '5', timestamp: '2026-04-08 13:45:30', actor: 'Admin (Skylar)', action: 'billing.invoice_create', entity: 'Family: Martinez', details: 'April tuition invoice #INV-2026-0412 - $1,200.00', ip: '192.168.1.10' },
    { id: '6', timestamp: '2026-04-08 13:30:00', actor: 'System', action: 'cert_expiry.alert', entity: 'Staff: James Wilson', details: 'CPR certification expires in 28 days', ip: '—' },
    { id: '7', timestamp: '2026-04-08 13:12:18', actor: 'Maria Garcia', action: 'check_out.create', entity: 'Student: Noah Williams', details: 'Authorized pickup by grandmother (ID verified)', ip: '192.168.1.48' },
    { id: '8', timestamp: '2026-04-08 12:55:00', actor: 'Admin (Skylar)', action: 'impersonation.start', entity: 'User: Jane Martinez (parent)', details: 'Reason: Helping parent troubleshoot billing view', ip: '192.168.1.10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Audit Log
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Immutable, append-only record of every state change. Cannot be edited or deleted.
        </p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
        >
          <option>All Actions</option>
          <option>check_in</option>
          <option>check_out</option>
          <option>student.create</option>
          <option>student.update</option>
          <option>billing</option>
          <option>daily_report</option>
          <option>impersonation</option>
          <option>emergency</option>
        </select>
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
        >
          <option>All Users</option>
          <option>Sarah Johnson</option>
          <option>Maria Garcia</option>
          <option>Emily Davis</option>
          <option>Admin (Skylar)</option>
          <option>System</option>
        </select>
        <input
          type="date"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
          defaultValue="2026-04-08"
        />
        <input
          type="text"
          placeholder="Search entities..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
        />
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Filter
        </button>
      </div>

      {/* Log entries */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Timestamp', 'Actor', 'Action', 'Entity', 'Details', 'IP'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {entry.timestamp}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {entry.actor}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded px-2 py-0.5 font-mono text-xs"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>{entry.entity}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {entry.details}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {entry.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Showing 1-8 of 12,847 entries
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Previous
          </button>
          <button
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
