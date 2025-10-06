import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchEventsByDate, fetchEventsByRange } from '@/services/calendarQueries'
import type { CalendarEvent } from '@/lib/supabase'

// Mock connectivity to toggle remote/local paths
vi.mock('@/lib/connectivity', () => ({
  canRemoteSync: vi.fn(() => true),
}))

// Mock calendarStore for offline fallback
const loadMock = vi.fn()
vi.mock('@/lib/supabase', async (orig) => {
  const actual = await (orig as any)()
  return {
    ...actual,
    calendarStore: { load: loadMock },
  }
})

// Minimal supabase client mock to return data for our queries
const supabaseMock = {
  from: vi.fn().mockImplementation((_table: string) => {
    let _data: CalendarEvent[] = []
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((_k: string, _v: string) => {
        return {
          order: vi.fn().mockImplementation((_k2: string) => {
            return { data: _data, error: null }
          }),
        }
      }),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation((_k2: string) => {
        return { data: _data, error: null }
      }),
      // helper to preload data in tests
      __setData: (d: CalendarEvent[]) => { _data = d },
    }
  }),
} as any

vi.mock('@/lib/supabaseClient', () => supabaseMock)

const setRemoteData = (list: CalendarEvent[]) => {
  const f = supabaseMock.from as any
  const inst = f('calendar_events') // get one instance to set payload
  inst.__setData(list)
}

describe('calendarQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchEventsByDate sorts by time', async () => {
    const day = '2025-01-10'
    setRemoteData([
      { id: '2', title: 'B', date: day, time: '15:00', duration: 30, color: '#000' },
      { id: '1', title: 'A', date: day, time: '09:00', duration: 30, color: '#000' },
    ] as CalendarEvent[])
    const out = await fetchEventsByDate(day)
    expect(out.map(e => e.id)).toEqual(['1', '2'])
  })

  it('fetchEventsByRange groups by date and sorts within each day', async () => {
    setRemoteData([
      { id: '1', title: 'A', date: '2025-01-06', time: '10:00', duration: 10, color: '#000' }, // Mon
      { id: '2', title: 'B', date: '2025-01-06', time: '08:00', duration: 10, color: '#000' },
      { id: '3', title: 'C', date: '2025-01-08', time: '09:30', duration: 10, color: '#000' }, // Wed
    ] as CalendarEvent[])
    const out = await fetchEventsByRange('2025-01-06', '2025-01-12')
    expect(Object.keys(out)).toContain('2025-01-06')
    expect(Object.keys(out)).toContain('2025-01-08')
    expect(out['2025-01-06'].map(e => e.id)).toEqual(['2', '1'])
    expect(out['2025-01-08'].map(e => e.id)).toEqual(['3'])
  })

  it('falls back to local cache when remote disabled', async () => {
    const { canRemoteSync } = await import('@/lib/connectivity')
    ;(canRemoteSync as any).mockReturnValue(false)
    const local: CalendarEvent[] = [
      { id: 'x', title: 'Local', date: '2025-02-01', time: '12:00', duration: 30, color: '#000' },
      { id: 'y', title: 'Local 2', date: '2025-02-02', time: '08:00', duration: 30, color: '#000' },
    ]
    loadMock.mockResolvedValue(local)
    const out = await fetchEventsByDate('2025-02-01')
    expect(out.map(e => e.id)).toEqual(['x'])
  })
})
