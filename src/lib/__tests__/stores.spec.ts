import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createReactiveStore } from '@/lib/supabase'

vi.mock('@/services/storage', () => {
  let db: Record<string, any> = {}
  return {
    getJSON: async <T>(key: string, fallback: T): Promise<T> => (key in db ? db[key] : fallback),
    setJSON: async <T>(key: string, value: T) => { db[key] = value },
    STORAGE_KEYS: { test: 'test' }
  }
})

vi.mock('@/lib/eventBus', () => {
  const listeners: Record<string, Array<(d?: any)=>void>> = {}
  return {
    eventBus: {
      on: (e: string, cb: (d?: any)=>void) => { (listeners[e] ||= []).push(cb) },
      off: (e: string, cb: (d?: any)=>void) => { listeners[e] = (listeners[e]||[]).filter(l=>l!==cb) },
      emit: (e: string, d?: any) => { (listeners[e]||[]).forEach(l=>l(d)) }
    },
    EVENTS: { updated: 'updated' }
  }
})

describe('createReactiveStore', () => {
  beforeEach(() => {
    // reset mocks state if needed
  })

  it('loads fallback and updates value', async () => {
    const store = createReactiveStore<any[]>('test-key', 'updated', [])
    const initial = await store.load()
    expect(initial).toEqual([])
    await store.set([{ id: 1 }])
    expect(store.get()).toEqual([{ id: 1 }])
  })
})

