import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { CalendarEventRecord } from '@/hooks/useCalendarEvents'

export type CalendarMode = 'month' | 'week' | 'day'

interface Props {
  mode: CalendarMode
  date: string          // current focal date (YYYY-MM-DD)
  events: CalendarEventRecord[]
  onSelectDate?: (iso: string) => void
  className?: string
}

const toIso = (d: Date) => d.toISOString().split('T')[0]

const startOfWeek = (d: Date) => {
  const out = new Date(d)
  const day = out.getDay() // 0 Sun
  const diff = (day + 6) % 7 // make Monday start
  out.setDate(out.getDate() - diff)
  out.setHours(0,0,0,0)
  return out
}

export const CalendarView: React.FC<Props> = ({ mode, date, events, onSelectDate, className }) => {
  const { t } = useTranslation()
  const current = new Date(date + 'T00:00:00')

  const monthMatrix = useMemo(() => {
    if (mode !== 'month') return []
    const first = new Date(current.getFullYear(), current.getMonth(), 1)
    const firstWeekStart = startOfWeek(first)
    const weeks: Date[][] = []
    for (let w = 0; w < 6; w++) {
      const row: Date[] = []
      for (let i = 0; i < 7; i++) {
        const cell = new Date(firstWeekStart)
        cell.setDate(firstWeekStart.getDate() + w * 7 + i)
        row.push(cell)
      }
      weeks.push(row)
    }
    return weeks
  }, [mode, current])

  const weekDays = useMemo(() => {
    const start = startOfWeek(current)
    return new Array(7).fill(null).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [current])

  const dayEvents = useMemo(() => events.filter(e => e.date === date), [events, date])

  const renderDayCell = (d: Date) => {
    const iso = toIso(d)
    const inMonth = d.getMonth() === current.getMonth()
    const dayEvs = events.filter(e => e.date === iso).slice(0, 3)
    return (
      <button
        key={iso}
        onClick={() => onSelectDate?.(iso)}
        className={cn(
          'text-left p-1 rounded-md border transition-all focus:outline-none focus:ring-1 focus:ring-primary',
          iso === date ? 'bg-primary text-primary-foreground border-primary' : 'bg-background',
          !inMonth && 'opacity-40'
        )}
      >
        <div className="text-xs font-medium">{d.getDate()}</div>
        <div className="mt-1 space-y-0.5">
          {dayEvs.map(ev => (
            <div
              key={ev.id}
              className="h-2 rounded-full"
              style={{ background: ev.color || '#2563eb' }}
              title={ev.title}
            />
          ))}
          {events.filter(e => e.date === iso).length > 3 && (
            <div className="text-[10px] opacity-70">
              +{events.filter(e => e.date === iso).length - 3}
            </div>
          )}
        </div>
      </button>
    )
  }

  if (mode === 'month') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="grid grid-cols-7 gap-1 text-[11px] uppercase tracking-wide font-medium opacity-70">
          {[...Array(7)].map((_, i) => {
            const day = weekDays[i]
            return <div key={i} className="text-center">{t(`calendar.weekday.${day.getDay()}`)}</div>
          })}
        </div>
        <div className="grid grid-rows-6 gap-1">
          {monthMatrix.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map(renderDayCell)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (mode === 'week') {
    const start = startOfWeek(current)
    return (
      <div className={cn('grid grid-cols-7 gap-2', className)}>
        {new Array(7).fill(null).map((_, i) => {
          const d = new Date(start)
            d.setDate(start.getDate() + i)
          const iso = toIso(d)
          const colEvents = events.filter(e => e.date === iso)
          return (
            <div
              key={iso}
              className={cn(
                'p-2 rounded-lg border flex flex-col min-h-[120px]',
                iso === date && 'border-primary'
              )}
            >
              <button
                onClick={() => onSelectDate?.(iso)}
                className="text-xs font-semibold text-left"
              >
                {t(`calendar.weekday.${d.getDay()}`)} {d.getDate()}
              </button>
              <div className="mt-1 space-y-1">
                {colEvents.map(e => (
                  <div
                    key={e.id}
                    className="text-[10px] px-1 py-0.5 rounded-md"
                    style={{ background: e.color || '#2563eb', color: '#fff' }}
                    title={`${e.time} {e.title}`}
                  >
                    {e.time} {e.title}
                  </div>
                ))}
                {colEvents.length === 0 && (
                  <div className="text-[10px] opacity-40">{t('calendar.emptyDay')}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Day
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold">
        {t('calendar.dayView.title', { date })}
      </h3>
      <ul className="space-y-2">
        {dayEvents.length === 0 && (
          <li className="text-xs opacity-60">{t('calendar.empty')}</li>
        )}
        {dayEvents.map(ev => (
          <li
            key={ev.id}
            className="p-2 rounded-md border flex items-center gap-2"
            style={{ borderColor: ev.color }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: ev.color }}
            />
            <div className="flex-1">
              <div className="text-xs font-medium">
                {ev.time} • {ev.title}
              </div>
              {ev.category && (
                <div className="text-[10px] opacity-60">{ev.category}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CalendarView
