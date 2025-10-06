import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import CalendarView, { type CalendarMode } from '@/components/calendar/CalendarView'
import EventForm from '@/components/calendar/EventForm'
import EventListDay from '@/components/calendar/EventListDay'
import UpcomingNotifications from '@/components/calendar/UpcomingNotifications'

const todayIso = () => new Date().toISOString().split('T')[0]

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation()
  const {
    events,
    isLoading,
    isError,
    addEvent,
    updateEvent,
    deleteEvent,
    setFilters,
    filters,
  } = useCalendarEvents()

  const [mode, setMode] = useState<CalendarMode>('month')
  const [selectedDate, setSelectedDate] = useState<string>(todayIso())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  const [localCategory, setLocalCategory] = useState(filters.category || '')
  const [rangeStart, setRangeStart] = useState(filters.startDate || '')
  const [rangeEnd, setRangeEnd] = useState(filters.endDate || '')

  const selectedDayEvents = useMemo(
    () => events.filter(e => e.date === selectedDate),
    [events, selectedDate]
  )

  const openCreate = useCallback(() => {
    setEditing(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((ev: any) => {
    setEditing(ev)
    setFormOpen(true)
  }, [])

  const applyFilters = () => {
    setFilters({
      category: localCategory || null,
      startDate: rangeStart || null,
      endDate: rangeEnd || null,
    })
  }

  const clearFilters = () => {
    setLocalCategory('')
    setRangeStart('')
    setRangeEnd('')
    setFilters({ category: null, startDate: null, endDate: null })
  }

  const handleSubmit = async (data: any) => {
    if (editing) {
      await updateEvent(editing.id, data)
    } else {
      await addEvent(data)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (confirmDelete) {
      await deleteEvent(confirmDelete.id)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mobile-padding pt-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('calendar.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('calendar.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={mode === 'month' ? 'default' : 'outline'}
              onClick={() => setMode('month')}
            >
              {t('calendar.mode.month')}
            </Button>
            <Button
              variant={mode === 'week' ? 'default' : 'outline'}
              onClick={() => setMode('week')}
            >
              {t('calendar.mode.week')}
            </Button>
            <Button
              variant={mode === 'day' ? 'default' : 'outline'}
              onClick={() => setMode('day')}
            >
              {t('calendar.mode.day')}
            </Button>
            <Button onClick={openCreate}>{t('calendar.newEvent')}</Button>
          </div>
        </div>

        <LifeSyncCard>
          <div className="grid md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-medium">
                {t('calendar.filters.category')}
              </label>
              <Input
                value={localCategory}
                onChange={e => setLocalCategory(e.target.value)}
                placeholder={t('calendar.filters.categoryPlaceholder') as string}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">
                {t('calendar.filters.startDate')}
              </label>
              <Input
                type="date"
                value={rangeStart}
                onChange={e => setRangeStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">
                {t('calendar.filters.endDate')}
              </label>
              <Input
                type="date"
                value={rangeEnd}
                onChange={e => setRangeEnd(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={applyFilters}
                className="flex-1"
              >
                {t('calendar.filters.apply')}
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                {t('calendar.filters.clear')}
              </Button>
            </div>
            <div className="text-xs opacity-60">
              {t('calendar.filters.total', { count: events.length })}
            </div>
          </div>
        </LifeSyncCard>

        <UpcomingNotifications events={events} />

        <LifeSyncCard>
          {isLoading && (
            <div className="text-xs opacity-60">{t('common.loading')}</div>
          )}
          {isError && (
            <div className="text-xs text-destructive">
              {t('calendar.error')}
            </div>
          )}
          <CalendarView
            mode={mode}
            date={selectedDate}
            events={events}
            onSelectDate={setSelectedDate}
          />
        </LifeSyncCard>

        {mode !== 'month' && (
          <LifeSyncCard>
            <EventListDay
              date={selectedDate}
              events={selectedDayEvents}
              onEdit={openEdit}
              onDelete={ev => setConfirmDelete(ev)}
            />
          </LifeSyncCard>
        )}
      </div>

      <EventForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialDate={selectedDate}
        editing={editing}
      />

      {confirmDelete && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="bg-background border rounded-xl p-4 w-full max-w-sm space-y-4">
            <h2 className="text-sm font-semibold">
              {t('calendar.delete.confirmTitle')}
            </h2>
            <p className="text-xs opacity-70">
              {t('calendar.delete.confirmMessage', { title: confirmDelete.title })}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteConfirmed}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// default export retained
export default CalendarPage
