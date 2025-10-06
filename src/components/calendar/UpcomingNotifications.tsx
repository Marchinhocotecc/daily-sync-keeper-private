import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalendarEventRecord } from '@/hooks/useCalendarEvents'

interface Props {
  events: CalendarEventRecord[]
  now?: Date
}

const diffMinutes = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 60000)

export const UpcomingNotifications: React.FC<Props> = ({ events, now }) => {
  const { t } = useTranslation()
  const refNow = now || new Date()
  const soon = useMemo(() => {
    return events
      .filter(e => {
        const dt = new Date(`${e.date}T${e.time}:00`)
        const m = diffMinutes(dt, refNow)
        return m >= 0 && m <= 15
      })
      .sort((a, b) => {
        const ad = new Date(`${a.date}T${a.time}:00`).getTime()
        const bd = new Date(`${b.date}T${b.time}:00`).getTime()
        return ad - bd
      })
      .slice(0, 5)
  }, [events, refNow])

  if (soon.length === 0) return null

  return (
    <div className="p-3 rounded-lg border bg-primary/5 border-primary/30 space-y-2">
      <div className="text-xs font-semibold">
        {t('calendar.upcoming.title', { count: soon.length })}
      </div>
      <ul className="space-y-1">
        {soon.map(e => {
          const m = diffMinutes(new Date(`${e.date}T${e.time}:00`), refNow)
          return (
            <li key={e.id} className="text-[11px] flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: e.color }}
              />
              <span className="font-medium">{e.time}</span>
              <span className="flex-1 truncate">{e.title}</span>
              <span className="opacity-60">
                {m === 0
                  ? t('calendar.upcoming.now')
                  : t('calendar.upcoming.inMinutes', { m })}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default UpcomingNotifications
