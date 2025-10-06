import React from 'react'
import { useTranslation } from 'react-i18next'
import type { CalendarEventRecord } from '@/hooks/useCalendarEvents'
import { Button } from '@/components/ui/button'

interface Props {
  date: string
  events: CalendarEventRecord[]
  onEdit?: (ev: CalendarEventRecord) => void
  onDelete?: (ev: CalendarEventRecord) => void
}

export const EventListDay: React.FC<Props> = ({ date, events, onEdit, onDelete }) => {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">
        {t('calendar.eventList.dayTitle', { date })}
      </h3>
      <ul className="space-y-2">
        {events.length === 0 && (
          <li className="text-xs opacity-50">{t('calendar.empty')}</li>
        )}
        {events.map(ev => (
          <li
            key={ev.id}
            className="flex items-center gap-3 p-2 rounded-md border bg-background/50"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: ev.color }}
            />
            <div className="flex-1">
              <div className="text-xs font-medium">
                {ev.time} • {ev.title}
              </div>
              <div className="text-[10px] opacity-60">
                {ev.category || t('calendar.form.noCategory')}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit?.(ev)}
              aria-label={t('common.edit')}
            >
              {t('common.edit')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete?.(ev)}
              aria-label={t('common.delete')}
            >
              {t('common.delete')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EventListDay
