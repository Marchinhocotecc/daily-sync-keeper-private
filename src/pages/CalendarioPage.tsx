import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { toArray } from '@/utils/toArray'

type Filter = 'all' | 'today' | 'week'

const toIso = (d: Date) => d.toISOString().split('T')[0]

const CalendarioPage: React.FC = () => {
  const { t } = useTranslation()
  const tr = (k: string, fb: string) => (t(k) === k ? fb : t(k))
  const { events, addEvent, deleteEvent, updateEvent, getEventsByWeek } = useCalendarEvents()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(toIso(new Date()))
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [color, setColor] = useState('#005f99')
  const [filter, setFilter] = useState<Filter>('all')

  const weekMap = useMemo(() => getEventsByWeek?.(date) ?? {}, [getEventsByWeek, date])
  const todayIso = useMemo(() => toIso(new Date()), [])

  const filtered = useMemo(() => {
    const list = toArray(events)
    if (filter === 'today') return list.filter(e => e.date === todayIso)
    if (filter === 'week') {
      const weekSet = new Set(Object.keys(weekMap))
      return list.filter(e => weekSet.has(e.date))
    }
    return list
  }, [events, filter, todayIso, weekMap])

  const handleAdd = async () => {
    if (!title.trim()) return
    await addEvent?.(title.trim(), date, time, duration, color)
    setTitle('')
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mobile-padding pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {tr('pages.calendar.title', 'Calendario')}
            </h1>
            <p className="text-muted-foreground">
              {tr('pages.calendar.subtitle', 'Gestisci i tuoi impegni')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
              {tr('pages.calendar.filter.all', 'Tutti')}
            </Button>
            <Button variant={filter === 'today' ? 'default' : 'outline'} onClick={() => setFilter('today')}>
              {tr('pages.calendar.filter.today', 'Oggi')}
            </Button>
            <Button variant={filter === 'week' ? 'default' : 'outline'} onClick={() => setFilter('week')}>
              {tr('pages.calendar.filter.week', 'Settimana')}
            </Button>
          </div>
        </div>

        <LifeSyncCard>
          <div className="grid md:grid-cols-5 gap-2">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={tr('pages.calendar.form.title', 'Titolo')}
              className="md:col-span-2"
            />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            <Input
              type="number"
              value={duration}
              onChange={e => setDuration(Number(e.target.value) || 0)}
              placeholder={tr('pages.calendar.form.duration', 'Durata (min)')}
            />
            <div className="flex items-center gap-2">
              <input
                aria-label={tr('pages.calendar.form.color', 'Colore')}
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-10 w-10 rounded"
              />
              <Button onClick={handleAdd}>{tr('common.add', 'Aggiungi')}</Button>
            </div>
          </div>
        </LifeSyncCard>

        <LifeSyncCard>
          <div className="mb-3 text-sm text-muted-foreground">
            {tr('pages.calendar.total', 'Totale eventi')}: {toArray(filtered).length}
          </div>
          <ScrollArea className="max-h-[60vh]">
            <ul className="space-y-2 pr-2">
              {toArray(filtered).length === 0 && (
                <li className="text-sm text-muted-foreground">
                  {tr('pages.calendar.empty', 'Nessun evento')}
                </li>
              )}
              {toArray(filtered).map((e: any) => (
                <li key={e.id} className="flex items-center gap-3 p-2 rounded-xl bg-background/50 border">
                  <div className="w-2 h-2 rounded-full" style={{ background: e.color || '#999' }} />
                  <div className="flex-1">
                    <div className="text-sm text-foreground">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.date} • {e.time} • {tr('pages.calendar.duration', 'Durata')}: {e.duration}’
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => updateEvent?.(e.id, { title: e.title })}>
                    {tr('common.edit', 'Modifica')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteEvent?.(e.id)}>
                    {tr('common.delete', 'Elimina')}
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </LifeSyncCard>
      </div>
    </div>
  )
}

export default CalendarioPage
