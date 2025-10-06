import type { Todo, Expense, CalendarEvent } from '@/lib/supabase'
import { toArray } from '@/utils/toArray'
import type { UserProfile } from '@/types/supabase'

// Slice State Types
export type ThemeMode = 'system' | 'light' | 'dark'

// Stable localStorage key used across the app and tests
export const GLOBAL_STATE_KEY = 'GLOBAL_STATE_V1'

export interface PreferencesState {
  language: string
  theme: ThemeMode
  notificationsEnabled: boolean
  notificationLeadMinutes: number
}

export interface TodosState {
  items: Todo[]
}

export interface ExpensesState {
  items: Expense[]
  monthlyBudget: number
  error: string | null
}

export interface CalendarState {
  items: CalendarEvent[]
}

export type AuthState = {
  user: UserProfile | null
  loading: boolean
}

export interface GlobalState {
  preferences: PreferencesState
  todos: TodosState
  expenses: ExpensesState
  calendar: CalendarState
  auth: AuthState
}

// Defaults (keep in sync with README and provider expectations)
export const initialState: GlobalState = {
  preferences: {
    language: (typeof window !== 'undefined' && (localStorage.getItem('lang') || 'en')) || 'en',
    theme: 'system',
    notificationsEnabled: true,
    notificationLeadMinutes: 10,
  },
  todos: { items: [] },
  expenses: { items: [], monthlyBudget: 0, error: null },
  calendar: { items: [] },
  auth: { user: null, loading: true },
}

// Helper to read from localStorage and merge with defaults
export function loadPersisted(storage: Storage = window.localStorage): GlobalState {
  const raw = safeGet(storage, GLOBAL_STATE_KEY)
  if (!raw) return initialState
  try {
    const parsed = JSON.parse(raw)
    // Shallow-merge state with defaults; deep-merge preferences to preserve new defaults
    return {
      ...initialState,
      ...parsed,
      preferences: {
        ...initialState.preferences,
        ...(parsed?.preferences || {}),
      },
    }
  } catch {
    return initialState
  }
}

// Optional small helpers (not required by tests)
function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

type TodosActions =
  | { type: 'todos/add'; item: Todo }
  | { type: 'todos/update'; id: string; changes: Partial<Todo> }
  | { type: 'todos/set'; items: Todo[] }
  | { type: 'todos/remove'; id: string }

type ExpensesActions =
  | { type: 'expenses/add'; item: Expense }
  | { type: 'expenses/set'; items: Expense[] }
  | { type: 'expenses/budget'; monthlyBudget: number }
  | { type: 'expenses/error'; error: string | null }

type CalendarActions =
  | { type: 'calendar/add'; item: CalendarEvent }
  | { type: 'calendar/set'; items: CalendarEvent[] }
  | { type: 'calendar/update'; id: string; changes: Partial<CalendarEvent> }
  | { type: 'calendar/remove'; id: string }

type PreferencesActions =
  | { type: 'preferences/setLanguage'; language: string }
  | { type: 'preferences/setTheme'; theme: ThemeMode }
  | { type: 'preferences/setNotifications'; enabled: boolean }
  | { type: 'preferences/setNotificationLead'; minutes: number }

type AuthActions =
  | { type: 'auth/login'; user: UserProfile }
  | { type: 'auth/logout' }
  | { type: 'auth/loading'; loading: boolean }

export type GlobalAction =
  | TodosActions
  | ExpensesActions
  | CalendarActions
  | PreferencesActions
  | AuthActions

// Provide alias to satisfy existing imports
export type Action = GlobalAction

// Local helper: sort calendar events by date then time
function sortCalendar(items: CalendarEvent[]): CalendarEvent[] {
  return toArray(items).slice().sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time)
    return a.date.localeCompare(b.date)
  })
}

export function rootReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    // Todos
    case 'todos/add':
      return { ...state, todos: { items: [...state.todos.items, action.item] } }
    case 'todos/update':
      return {
        ...state,
        todos: {
          items: state.todos.items.map(t => (t.id === action.id ? { ...t, ...action.changes } : t)),
        },
      }
    case 'todos/set':
      return { ...state, todos: { items: action.items.slice() } }
    case 'todos/remove':
      return { ...state, todos: { items: state.todos.items.filter(t => t.id !== action.id) } }

    // Expenses
    case 'expenses/add':
      return { ...state, expenses: { ...state.expenses, items: [...state.expenses.items, action.item] } }
    case 'expenses/set':
      return { ...state, expenses: { ...state.expenses, items: action.items.slice(), error: null } }
    case 'expenses/budget':
      return { ...state, expenses: { ...state.expenses, monthlyBudget: action.monthlyBudget } }
    case 'expenses/error':
      return { ...state, expenses: { ...state.expenses, error: action.error } }

    // Calendar
    case 'calendar/add': {
      const items = sortCalendar([...state.calendar.items, action.item])
      return { ...state, calendar: { items } }
    }
    case 'calendar/set':
      return { ...state, calendar: { items: sortCalendar(action.items) } }
    case 'calendar/update': {
      const items = sortCalendar(
        state.calendar.items.map(e => (e.id === action.id ? { ...e, ...action.changes } : e))
      )
      return { ...state, calendar: { items } }
    }
    case 'calendar/remove': {
      return { ...state, calendar: { items: state.calendar.items.filter(e => e.id !== action.id) } }
    }

    // Preferences
    case 'preferences/setLanguage':
      return { ...state, preferences: { ...state.preferences, language: action.language } }
    case 'preferences/setTheme':
      return { ...state, preferences: { ...state.preferences, theme: action.theme } }
    case 'preferences/setNotifications':
      return { ...state, preferences: { ...state.preferences, notificationsEnabled: action.enabled } }
    case 'preferences/setNotificationLead':
      return { ...state, preferences: { ...state.preferences, notificationLeadMinutes: action.minutes } }

    // Auth
    case 'auth/login':
      return { ...state, auth: { user: action.user, loading: false } }
    case 'auth/logout':
      return { ...state, auth: { user: null, loading: false } }
    case 'auth/loading':
      return { ...state, auth: { ...(state.auth || { user: null, loading: true }), loading: !!action.loading } }

    default:
      return state
  }
}

// -------------------------------------------------------------------
// Local storage middleware for GlobalState persistence
// -------------------------------------------------------------------

// NOTE: monthlyBudget now also hydrated from budgets table via GlobalStateProvider effect.

export interface LocalStorageLayer {
  getState(storage?: Storage): GlobalState
  setState(state: GlobalState, storage?: Storage): void
  clearState(storage?: Storage): void
}

/**
 * localStorageLayer:
 * - Centralizes reading/writing of the global state to localStorage
 * - Uses the stable GLOBAL_STATE_KEY
 * - Reuses loadPersisted for robust parsing and defaults merging
 */
export const localStorageLayer: LocalStorageLayer = {
  getState(storage) {
    try {
      const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
      if (!s) return initialState
      return loadPersisted(s)
    } catch {
      return initialState
    }
  },
  setState(state, storage) {
    try {
      const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
      if (!s) return
      s.setItem(GLOBAL_STATE_KEY, JSON.stringify(state))
    } catch {
      // no-op
    }
  },
  clearState(storage) {
    try {
      const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
      if (!s) return
      s.removeItem(GLOBAL_STATE_KEY)
    } catch {
      // no-op
    }
  },
}
