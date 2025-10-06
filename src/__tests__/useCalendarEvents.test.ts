import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from 
import { useCalendarEvents } from '@/hooks/useCalendarEvents'

// Mocks
vi.mock('@/state/global/GlobalStateProvider', () => ({
  useCalendarSlice: () => ({ events: [], refetch: vi.fn() }),
  useAuthSlice: () => ({ user: { id: 'u1' } }),
}))

// In-memory supabase mock
const db: any[] = []
const fromMock = vi.fn().mockImplementation((_table: string) => {
  const api = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation((rows: any[]) => {
      db.push(...rows)
      return {
        select: () => ({ single: () => ({ data: rows[0], error: null }) }),
      }
    }),
    update: vi.fn().mockImplementation((patch: any) => ({
      eq: () => ({
        eq: () => ({
          select: () => ({
            single: () => {
              const idx = db.findIndex(r => r.id === patch.id || patch.id === undefined)
              if (idx !== -1) {
                db[idx] = { ...db[idx], ...patch }
                return { data: db[idx], error: null }
              }
              return { data: null, error: null }
            },
          }),
        }),
      }),
    })),
    delete: vi.fn().mockImplementation(() => ({
      eq: () => ({
        eq: (_k: string, val: string) => {
          const i = db.findIndex(r => r.id === val)
          if (i !== -1) db.splice(i, 1)
          return { error: null }
        },
      }),
    })),
  }
  return api
})

vi.mock('@/lib/supabaseClient', () => ({
  default: {
    from: fromMock,
  },
}))

describe('useCalendarEvents', () => {
  beforeEach(() => {
    db.splice(0, db.length)
    vi.clearAllMocks()
  })

  it('adds an event', async () => {
    const { result } = renderHook(() => useCalendarEvents())
    await act(async () => {
      await result.current.addEvent({
        title: 'Test',
        date: '2025-01-01',
        time: '10:00',
        duration: 60,
        color: '#000',
        category: 'work',
        description: 'desc',
      })
    })
    expect(result.current.events.length).toBe(1)
  })

  it('updates an event', async () => {
    const { result } = renderHook(() => useCalendarEvents())
    let id = ''
    await act(async () => {
      const ev = await result.current.addEvent({
        title: 'A',
        date: '2025-01-01',
        time: '09:00',
        duration: 30,
        color: '#111',
        category: null,
        description: null,
      })
      id = ev!.id
    })
    await act(async () => {
      await result.current.updateEvent(id, { title: 'B' })
    })
    expect(result.current.events[0].title).toBe('B')
  })

  it('deletes an event', async () => {
    const { result } = renderHook(() => useCalendarEvents())
    let id = ''
    await act(async () => {
      const ev = await result.current.addEvent({
        title: 'Rem',
        date: '2025-01-02',
        time: '11:00',
        duration: 30,
        color: '#222',
        category: null,
        description: null,
      })
      id = ev!.id
    })
    await act(async () => {
      await result.current.deleteEvent(id)
    })
    expect(result.current.events.length).toBe(0)
  })

  it('sorts events by date+time', async () => {
    const { result } = renderHook(() => useCalendarEvents())
    await act(async () => {
      await result.current.addEvent({
        title: 'Late',
        date: '2025-03-01',
        time: '15:00',
        duration: 30,
        color: '#000',
        category: null,
        description: null,
      })
      await result.current.addEvent({
        title: 'Early',
        date: '2025-03-01',
        time: '09:00',
        duration: 30,
        color: '#000',
        category: null,
        description: null,
      })
    })
    expect(result.current.events[0].title).toBe('Early')
  })
})
