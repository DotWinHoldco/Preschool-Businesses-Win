'use client'

// @anchor: cca.dropin.availability-calendar
// Displays available drop-in days with color-coded capacity

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AvailabilityDay { date: string; slots_total: number; slots_booked: number; rate_cents: number; status: 'open' | 'full' | 'closed' }
interface AvailabilityCalendarProps { availability: AvailabilityDay[]; onDateSelect?: (date: string) => void }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function AvailabilityCalendar({ availability, onDateSelect }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const availByDate = new Map(availability.map((a) => [a.date, a]))
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="rounded p-1.5 hover:bg-gray-100" aria-label="Previous month"><ChevronLeft size={18} style={{ color: 'var(--color-foreground)' }} /></button>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>{MONTHS[month]} {year}</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="rounded p-1.5 hover:bg-gray-100" aria-label="Next month"><ChevronRight size={18} style={{ color: 'var(--color-foreground)' }} /></button>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (<div key={d} className="text-center text-xs font-medium py-2" style={{ color: 'var(--color-muted-foreground)' }}>{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (<div key={`pad-${i}`} />))}
          {Array.from({ length: totalDays }, (_, i) => {
            const d = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const avail = availByDate.get(dateStr)
            const isPast = dateStr < today
            const remaining = avail ? avail.slots_total - avail.slots_booked : 0
            const bgColor = !avail || isPast || avail.status === 'closed' ? 'var(--color-muted)' : avail.status === 'full' || remaining === 0 ? 'var(--color-destructive)' : remaining <= 2 ? 'var(--color-warning)' : 'var(--color-success, #10B981)'

            return (
              <button key={d} disabled={!avail || isPast || avail.status === 'closed' || avail.status === 'full'} onClick={() => avail && onDateSelect?.(dateStr)} className="relative rounded-md p-2 text-center min-h-[60px] disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: bgColor + '15' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{d}</span>
                {avail && !isPast && avail.status === 'open' && (
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                    {remaining} spot{remaining !== 1 ? 's' : ''}
                    <br />${(avail.rate_cents / 100).toFixed(0)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-success, #10B981)' }} /> Available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-warning)' }} /> Few spots</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-destructive)' }} /> Full</span>
      </div>
    </div>
  )
}
