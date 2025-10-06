import { getJson } from './storage'
import supabase from '@/lib/supabaseClient'
import { canRemoteSync } from '@/lib/connectivity'
import { calendarStore } from '@/lib/supabase'
import type { CalendarEvent } from '@/lib/supabase'

// Expected minimal shape of CalendarEvent used in UI
// { id: string; title: string; date: string; time: string; duration: number; color: string; ... }

const KEY = 'calendar.events'

function readAll(): CalendarEvent[] {
  return getJson<CalendarEvent[]>(KEY, []) || []
}

function sortByDateTime(arr: CalendarEvent[]) {
  return [...arr].sort((a, b) => {
    const ad = `${a.date}T${a.time || '00:00'}`
    const bd = `${b.date}T${b.time || '00:00'}`
    return ad.localeCompare(bd)
  })
}

// Normalize and sort by time ascending
const sortByTime = (list: CalendarEvent[]) =>
  list.slice().sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

export async function fetchEventsByDate(date: string): Promise<CalendarEvent[]> {
  if (canRemoteSync()) {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true })
    if (error || !data) return []
    return sortByTime(data as unknown as CalendarEvent[])
  }
  const local = await calendarStore.load()
  return sortByTime(local.filter(e => e.date === date))
}

export async function fetchEventsByRange(start: string, end: string): Promise<Record<string, CalendarEvent[]>> {
  const byDay: Record<string, CalendarEvent[]> = {}
  if (canRemoteSync()) {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    const list = (!error && data ? (data as unknown as CalendarEvent[]) : [])
    for (const ev of list) {
      if (!byDay[ev.date]) byDay[ev.date] = []
      byDay[ev.date].push(ev)
    }
  } else {
    const local = await calendarStore.load()
    for (const ev of local) {
      if (ev.date >= start && ev.date <= end) {
        if (!byDay[ev.date]) byDay[ev.date] = []
        byDay[ev.date].push(ev)
      }
    }
  }
  for (const k of Object.keys(byDay)) byDay[k] = sortByTime(byDay[k])
  return byDay
}
