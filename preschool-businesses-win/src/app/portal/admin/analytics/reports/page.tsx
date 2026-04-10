// @anchor: cca.analytics.reports-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom Reports | Admin Portal',
  description: 'Build, save, schedule, and export custom reports',
}

export default function AdminCustomReportsPage() {
  const mockSavedReports = [
    { id: '1', name: 'Weekly Attendance Summary', entity: 'Attendance', schedule: 'Every Friday 5:00 PM', lastRun: '2026-04-04' },
    { id: '2', name: 'Monthly Revenue by Classroom', entity: 'Billing', schedule: '1st of month', lastRun: '2026-04-01' },
    { id: '3', name: 'Staff Hours & Overtime', entity: 'Staff', schedule: 'Every Monday 8:00 AM', lastRun: '2026-04-07' },
    { id: '4', name: 'Enrollment Funnel', entity: 'Enrollment', schedule: 'None', lastRun: '2026-03-28' },
  ]

  const entityOptions = ['Students', 'Families', 'Staff', 'Attendance', 'Billing', 'Enrollment', 'Classrooms', 'Compliance']

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Custom Report Builder
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Build, save, and schedule custom reports from any data in the platform.
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          + New Report
        </button>
      </div>

      {/* Report builder */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Build a Report
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Data Source</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            >
              <option value="">Select entity...</option>
              {entityOptions.map((e) => (
                <option key={e} value={e.toLowerCase()}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Date Range</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Group By</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            >
              <option>None</option>
              <option>Classroom</option>
              <option>Program</option>
              <option>Staff Member</option>
              <option>Month</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Format</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            >
              <option>Table</option>
              <option>CSV Export</option>
              <option>PDF Export</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Run Report
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Save Report
          </button>
        </div>
      </div>

      {/* Saved reports */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Saved Reports
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Report Name', 'Data Source', 'Schedule', 'Last Run', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockSavedReports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{r.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{r.entity}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{r.schedule}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{r.lastRun}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Run</button>
                      <button className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Edit</button>
                      <button className="text-xs font-medium" style={{ color: 'var(--color-destructive)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
