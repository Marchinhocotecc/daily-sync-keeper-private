import { Preferences } from '@capacitor/preferences'
import { eventBus, EVENTS } from '@/lib/eventBus'

// -----------------------------
// Async API (Capacitor Preferences)
// -----------------------------
export const aGetItem = async (key: string): Promise<string | null> => {
  try {
    const { value } = await Preferences.get({ key })
    return value ?? null
  } catch {
    return null
  }
}

export const aSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await Preferences.set({ key, value })
    eventBus.emit(EVENTS.storageChange, { [key]: value })
  } catch {
    // no-op
  }
}

export const aRemoveItem = async (key: string): Promise<void> => {
  try {
    await Preferences.remove({ key })
    eventBus.emit(EVENTS.storageChange, { [key]: null })
  } catch {
    // no-op
  }
}

export const aClearStorage = async (): Promise<void> => {
  try {
    await Preferences.clear()
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}

export const aGetJSON = async <T>(key: string, fallback: T): Promise<T> => {
  const raw = await aGetItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const aSetJSON = async <T>(key: string, value: T): Promise<void> => {
  try {
    await aSetItem(key, JSON.stringify(value))
  } catch {
    // no-op
  }
}

// -----------------------------
// Sync API (localStorage)
// -----------------------------
export const STORAGE_KEYS = {
  AUTH: 'dsk.auth',
  PROFILE: 'dsk.profile',
  authSession: 'dsk.auth.session',
  syncMetadata: 'dsk.sync.meta',
  wellness: 'dsk.wellness', // NEW
} as const

const NS = 'dsk' // daily-sync-keeper namespace

const key = (k: string) => `${NS}:${k}`

export function get<T = unknown>(k: string, fallback?: T): T | undefined {
  try {
    const v = localStorage.getItem(key(k))
    return v == null ? fallback : (v as unknown as T)
  } catch {
    return fallback
  }
}

export function set(k: string, v: string) {
  try { localStorage.setItem(key(k), v) } catch { /* noop */ }
}

export function getJson<T = unknown>(k: string, fallback?: T): T {
  try {
    const v = localStorage.getItem(key(k))
    if (v == null) return fallback as T
    return JSON.parse(v) as T
  } catch {
    return fallback as T
  }
}

export function setJson(k: string, v: unknown) {
  try { localStorage.setItem(key(k), JSON.stringify(v)) } catch { /* noop */ }
}

export function remove(k: string) {
  try { localStorage.removeItem(key(k)) } catch { /* noop */ }
}

export function clearStorage() {
  try {
    localStorage.clear()
  } catch {}
}

const safeParse = <T>(v: string | null, fallback: T): T => {
  try {
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export const getJSON = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback
  return safeParse<T>(localStorage.getItem(key), fallback)
}

export const setJSON = <T>(key: string, value: T) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
  try {
    window?.dispatchEvent?.(new StorageEvent('storage', { key, newValue: JSON.stringify(value) }))
  } catch {
    // ignore
  }
}