'use client'

// @anchor: cca.analytics.attendance-heatmap
// Attendance heatmap visualization (day-of-week vs week)

interface HeatmapCell { date: string; rate: number }
interface AttendanceHeatmapProps { data: HeatmapCell[]; title?: string }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function AttendanceHeatmap({ data, title = 'Attendance Heatmap' }: AttendanceHeatmapProps) {
  const cellsByWeekDay = new Map<string, number>()
  for (const cell of data) {
    const d = new Date(cell.date)
    const weekNum = Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)
    cellsByWeekDay.set(`${weekNum}-${d.getDay()}`, cell.rate)
  }

  const weeks = Math.max(...data.map((c) => {
    const d = new Date(c.date)
    return Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)
  }), 5)

  const getColor = (rate: number) => {
    if (rate >= 95) return 'var(--color-success, #10B981)'
    if (rate >= 85) return 'var(--color-primary)'
    if (rate >= 70) return 'var(--color-warning)'
    return 'var(--color-destructive)'
  }

  return (
    <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>{title}</h3>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-2">
          {DAYS.map((d) => (<div key={d} className="h-8 flex items-center"><span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{d}</span></div>))}
        </div>
        {Array.from({ length: weeks }, (_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {[1, 2, 3, 4, 5].map((dayIdx) => {
              const rate = cellsByWeekDay.get(`${weekIdx + 1}-${dayIdx}`)
              return (
                <div key={dayIdx} className="w-8 h-8 rounded" style={{ backgroundColor: rate !== undefined ? getColor(rate) : 'var(--color-muted)', opacity: rate !== undefined ? 0.8 : 0.3 }} title={rate !== undefined ? `${rate}%` : 'No data'} />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        <span>Low</span>
        {[70, 85, 95].map((r) => (<div key={r} className="w-4 h-4 rounded" style={{ backgroundColor: getColor(r) }} />))}
        <span>High</span>
      </div>
    </div>
  )
}
