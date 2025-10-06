import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { useCalendarSlice, useAuthSlice } from '@/state/global/GlobalStateProvider'

export interface CalendarEventRecord {
  id: string
  title: string
  date: string            // YYYY-MM-DD
  time: string            // HH:MM
  duration: number        // minutes
  color: string
  category?: string | null
  description?: string | null
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface CalendarFilters {
  category?: string | null
  startDate?: string | null
  endDate?: string | null
}

interface UseCalendarEventsResult {
  events: CalendarEventRecord[]
  isLoading: boolean
  isError: boolean
  error: any
  addEvent: (data: Omit<CalendarEventRecord, 'id'>) => Promise<CalendarEventRecord | null>
  updateEvent: (id: string, changes: Partial<CalendarEventRecord>) => Promise<CalendarEventRecord | null>
  deleteEvent: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
  setFilters: (f: Partial<CalendarFilters>) => void
  filters: CalendarFilters
  // Backward compat
  loading: boolean
  getEventsForDate?: (iso: string) => CalendarEventRecord[]
  getEventsByDay?: (iso: string) => CalendarEventRecord[]
  getEventsByWeek?: (startIso: string) => Record<string, CalendarEventRecord[]>
}

const TABLE = 'calendar_events'

// Sort helper
const sortEvents = (list: CalendarEventRecord[]) =>
  list.slice().sort((a, b) => {
    if (a.date === b.date) return (a.time || '').localeCompare(b.time || '')
    return a.date.localeCompare(b.date)
  })

export const useCalendarEvents = (): UseCalendarEventsResult => {
  // Global slice (for legacy consumers)
  const slice = useCalendarSlice()
  const { user } = useAuthSlice()
  const userId = user?.id || null

  // Local authoritative list (still syncs to global slice for UI already using it)
  const [events, setEvents] = useState<CalendarEventRecord[]>(() => sortEvents(slice.events as any))
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<any>(null)
  const mounted = useRef(true)

  const [filters, setFiltersState] = useState<CalendarFilters>({})

  const setFilters = useCallback((f: Partial<CalendarFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f }))
  }, [])

  const applyFilters = useCallback((list: CalendarEventRecord[]) => {
    return list.filter(ev => {
      if (filters.category && ev.category !== filters.category) return false
      if (filters.startDate && ev.date < filters.startDate) return false
      if (filters.endDate && ev.date > filters.endDate) return false
      return true
    })
  }, [filters])

  const loadRemote = useCallback(async () => {
    if (!userId) {
      // Not authenticated -> fall back to global slice content
      setEvents(prev => sortEvents(slice.events as any))
      return
    }
    setIsLoading(true)
    setIsError(false)
    setError(null)
    try {
      let query = supabase.from(TABLE).select('*').eq('user_id', userId)
      if (filters.category) query = query.eq('category', filters.category)
      if (filters.startDate) query = query.gte('date', filters.startDate)
      if (filters.endDate) query = query.lte('date', filters.endDate)
      const { data, error: err } = await query
      if (err) throw err
      const sorted = sortEvents((data || []) as CalendarEventRecord[])
      if (mounted.current) {
        setEvents(sorted)
        // keep global slice sync (best effort)
        slice?.refetch?.()
      }
    } catch (e) {
      if (mounted.current) {
        setIsError(true)
        setError(e)
      }
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [userId, filters, slice])

  const refetch = useCallback(async () => {
    await loadRemote()
  }, [loadRemote])

  // Initial + filters/user changes
  useEffect(() => {
    mounted.current = true
    refetch()
    return () => { mounted.current = false }
  }, [refetch])

  // Legacy global slice changes (only if unauthenticated)
  useEffect(() => {
    if (!userId) {
      setEvents(sortEvents(slice.events as any))
    }
  }, [slice.events, userId])

  const addEvent = useCallback(async (data: Omit<CalendarEventRecord, 'id'>) => {
    const id = crypto.randomUUID()
    const base: CalendarEventRecord = {
      ...data,
      id,
      user_id: userId || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    // Optimistic local
    setEvents(prev => sortEvents([...prev, base]))
    try {
      if (userId) {
        const { data: inserted, error: err } = await supabase
          .from(TABLE)
          .insert({
            id,
            title: base.title,
            date: base.date,
            time: base.time,
            duration: base.duration,
            color: base.color,
            category: base.category,
            description: base.description,
            user_id: userId,
          })
          .select('*')
          .single()
        if (err) throw err
        setEvents(prev => sortEvents(prev.map(e => (e.id === id ? { ...(inserted as any) } : e))))
        slice?.refetch?.()
        return inserted as any
      }
      return base
    } catch (e) {
      // Revert optimistic on fail
      setEvents(prev => prev.filter(e => e.id !== id))
      setIsError(true)
      setError(e)
      return null
    }
  }, [userId, slice])

  const updateEvent = useCallback(async (id: string, changes: Partial<CalendarEventRecord>) => {
    const prevSnapshot = events
    setEvents(prev => sortEvents(prev.map(e => (e.id === id ? { ...e, ...changes, updated_at: new Date().toISOString() } : e))))
    try {
      if (userId) {
        const { data: updated, error: err } = await supabase
          .from(TABLE)
            .update({
              ...('title' in changes ? { title: changes.title } : {}),
              ...('date' in changes ? { date: changes.date } : {}),
              ...('time' in changes ? { time: changes.time } : {}),
              ...('duration' in changes ? { duration: changes.duration } : {}),
              ...('color' in changes ? { color: changes.color } : {}),
              ...('category' in changes ? { category: changes.category } : {}),
              ...('description' in changes ? { description: changes.description } : {}),
            })
          .eq('id', id)
          .eq('user_id', userId)
          .select('*')
          .single()
        if (err) throw err
        setEvents(prev => sortEvents(prev.map(e => (e.id === id ? (updated as any) : e))))
        slice?.refetch?.()
        return updated as any
      }
      return events.find(e => e.id === id) || null
    } catch (e) {
      setEvents(prevSnapshot)
      setIsError(true)
      setError(e)
      return null
    }
  }, [events, userId, slice])

  const deleteEvent = useCallback(async (id: string) => {
    const prevSnapshot = events
    setEvents(prev => prev.filter(e => e.id !== id))
    try {
      if (userId) {
        const { error: err } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId)
        if (err) throw err
        slice?.refetch?.()
      }
      return true
    } catch (e) {
      setEvents(prevSnapshot)
      setIsError(true)
      setError(e)
      return false
    }
  }, [events, userId, slice])

  // Derived helpers (legacy compatibility)
  const getEventsForDate = useCallback((iso: string) => events.filter(e => e.date === iso), [events])
  const getEventsByDay = getEventsForDate
  const getEventsByWeek = useCallback((startIso: string) => {
    const start = new Date(startIso)
    start.setHours(0,0,0,0)
    const map: Record<string, CalendarEventRecord[]> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const iso = d.toISOString().split('T')[0]
      map[iso] = events.filter(e => e.date === iso)
    }
    return map
  }, [events])

  const filtered = useMemo(() => applyFilters(events), [events, applyFilters])

  return {
    events: filtered,
    isLoading,
    isError,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch,
    setFilters,
    filters,
    // compatibility
    loading: isLoading,
    getEventsForDate,
    getEventsByDay,
    getEventsByWeek,
  }
}

export default useCalendarEvents