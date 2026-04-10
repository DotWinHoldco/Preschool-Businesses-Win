// @anchor: cca.analytics.revenue-chart
// Revenue trend chart placeholder (uses recharts in production)

interface RevenueDataPoint { month: string; revenue: number; expenses: number }
interface RevenueChartProps { data: RevenueDataPoint[]; title?: string }

export function RevenueChart({ data, title = 'Revenue Trend' }: RevenueChartProps) {
  const maxValue = Math.max(...data.flatMap((d) => [d.revenue, d.expenses]), 1)

  return (
    <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>{title}</h3>
      <div className="flex items-end gap-2 h-48">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
              <div className="flex-1 rounded-t" style={{ height: `${(d.revenue / maxValue) * 100}%`, backgroundColor: 'var(--color-primary)', minHeight: 2 }} />
              <div className="flex-1 rounded-t" style={{ height: `${(d.expenses / maxValue) * 100}%`, backgroundColor: 'var(--color-accent, #F15A50)', minHeight: 2, opacity: 0.7 }} />
            </div>
            <span className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>{d.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-primary)' }} /> Revenue</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-accent, #F15A50)', opacity: 0.7 }} /> Expenses</span>
      </div>
    </div>
  )
}
