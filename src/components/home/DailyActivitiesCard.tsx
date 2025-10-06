import React from 'react'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { useCalendarSlice } from '@/state/global/GlobalStateProvider'
import { useTranslation } from 'react-i18next'

export const DailyActivitiesCard: React.FC = () => {
  const { t } = useTranslation()
  const { events, getEventsByDay } = useCalendarSlice()
  const today = new Date().toISOString().split('T')[0]
  const list = getEventsByDay ? getEventsByDay(today) : events.filter(e => e.date === today)

  return (
    <LifeSyncCard className="space-y-3" aria-labelledby="home-daily-acts-title">
      <h2 id="home-daily-acts-title" className="text-lg font-semibold text-foreground">
        {t('home.dailyActivities.title', 'home.dailyActivities.title')}
      </h2>
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('home.dailyActivities.empty', 'home.dailyActivities.empty')}
        </p>
      )}
      {list.length > 0 && (
        <ul className="text-sm list-disc pl-4 space-y-1">
          {list.map(ev => (
            <li key={ev.id}>
              <span className="font-medium">{ev.time}</span>{' '}
              <span>{ev.title}</span>
            </li>
          ))}
        </ul>
      )}
    </LifeSyncCard>
  )
}
