import { getJSON as baseGetJSON, setJSON as baseSetJSON } from '@/services/storage'
import { eventBus, EVENTS } from '@/lib/eventBus'

// Database types
export interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  created_at: string
  user_id?: string
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  time: string | null
  duration: number
  color: string | null
  category?: string | null
  description?: string | null
}

export interface Expense {
  id: string
  amount: number
  category: string
  description?: string // made optional for alignment
  date: string
  icon: string
  user_id?: string
  notes?: string | null // added to match DB + component usage
}

export interface WellnessData {
  id: string
  steps: number
  step_goal: number
  calories: number
  calorie_goal: number
  date: string
  user_id?: string
  mood?: number
  energy?: number
  notes?: string | null
}

export interface UserSettings {
  id: string
  user_id: string
  monthly_budget: number
  notifications_enabled: boolean
  dark_mode: boolean
}

// Helpers to handle both sync/async mocked implementations in tests
const getJSONAsync = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const res = await (baseGetJSON as any)(key, fallback)
    return (res ?? fallback) as T
  } catch {
    return fallback
  }
}
const setJSONAsync = async <T>(key: string, value: T): Promise<void> => {
  try {
    await Promise.resolve((baseSetJSON as any)(key, value))
  } catch {
    // no-op
  }
}

// Lightweight offline-first stores
export type Updater<T> = T | ((prev: T) => T)
export type ReactiveStore<T> = {
  get: () => T
  set: (next: Updater<T>) => Promise<void>
  subscribe: (fn: () => void) => () => void
  load: () => Promise<T>
}

// Persistent reactive store
export function createReactiveStore<T>(storageKey: string, eventName: string, initial: T): ReactiveStore<T> {
  let state = initial
  const subs = new Set<() => void>()

  const notify = () => {
    try { eventBus.emit(eventName as any, state as any) } catch {}
    subs.forEach((fn) => fn())
  }

  return {
    get: () => state,
    set: async (next: Updater<T>) => {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next
      await setJSONAsync(storageKey, state)
      notify()
    },
    subscribe: (fn: () => void) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    load: async () => {
      state = await getJSONAsync<T>(storageKey, initial)
      notify()
      return state
    },
  }
}

// App stores (persistent)
export const todosStore = createReactiveStore<Todo[]>('dsk.todos', EVENTS.todosUpdated, [])
export const calendarStore = createReactiveStore<CalendarEvent[]>('dsk.calendar', EVENTS.calendarUpdated, [])
export const expensesStore = createReactiveStore<Expense[]>('dsk.expenses', EVENTS.expensesUpdated, [])
export const settingsStore = createReactiveStore<Partial<UserSettings>>('dsk.settings', EVENTS.settingsUpdated, { monthly_budget: 1000 })