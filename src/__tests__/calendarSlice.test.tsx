import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// Minimal mocks to isolate GlobalStateProvider side-effects
vi.mock('@/i18n', () => ({
  default: {
    language: 'it',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))
vi.mock('@/lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))
vi.mock('@/services/reminderScheduler', () => ({
  registerServiceWorker: vi.fn(),
  rescheduleAll: vi.fn(),
  scheduleInPage: vi.fn(),
}))
vi.mock('@/services/notifications', () => ({
  showInstantNotification: vi.fn(),
  requestNotificationPermission: vi.fn().mockResolvedValue(true),
}))
vi.mock('@/services/authService', () => ({
  updateUserLanguage: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/connectivity', () => ({
  canRemoteSync: vi.fn(() => false),
}))

import { GlobalStateProvider } from '@/state/global/GlobalStateProvider'
import { useCalendarSlice } from '@/state/global/GlobalStateProvider'

const Harness: React.FC = () => {
  const {
    events,
    addEvent,
    deleteEvent,
    getEventsByDay,
    getEventsByWeek,
  } = useCalendarSlice()

  const fixedDate = '2025-01-01'

  return (
    <div>
      <div data-testid="count">{events.length}</div>
      <div data-testid="dayCount">{getEventsByDay(fixedDate).length}</div>
      <div data-testid="weekCount">
        {
          Object.values(getEventsByWeek(fixedDate))
            .reduce((acc, arr) => acc + arr.length, 0)
        }
      </div>

      <button
        onClick={() => addEvent('Test Event', fixedDate, '10:00', 60, '#000')}
      >
        add
      </button>
      <button
        onClick={() => {
          if (events[0]) deleteEvent(events[0].id)
        }}
      >
        del
      </button>
    </div>
  )
}

describe('useCalendarSlice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates an event', async () => {
    render(
      <GlobalStateProvider>
        <Harness />
      </GlobalStateProvider>
    )
    expect(screen.getByTestId('count').textContent).toBe('0')
    await act(async () => {
      fireEvent.click(screen.getByText('add'))
    })
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('returns events for a specific day', async () => {
    render(
      <GlobalStateProvider>
        <Harness />
      </GlobalStateProvider>
    )
    await act(async () => {
      fireEvent.click(screen.getByText('add'))
    })
    expect(screen.getByTestId('dayCount').textContent).toBe('1')
  })

  it('returns events for the week (7-day view)', async () => {
    render(
      <GlobalStateProvider>
        <Harness />
      </GlobalStateProvider>
    )
    await act(async () => {
      fireEvent.click(screen.getByText('add'))
    })
    // One event inside the 7-day window
    expect(screen.getByTestId('weekCount').textContent).toBe('1')
  })

  it('deletes an event', async () => {
    render(
      <GlobalStateProvider>
        <Harness />
      </GlobalStateProvider>
    )
    await act(async () => {
      fireEvent.click(screen.getByText('add'))
    })
    expect(screen.getByTestId('count').textContent).toBe('1')
    await act(async () => {
      fireEvent.click(screen.getByText('del'))
    })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('returns empty lists when there are no events', async () => {
    render(
      <GlobalStateProvider>
        <Harness />
      </GlobalStateProvider>
    )
    // Initially nothing
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('dayCount').textContent).toBe('0')
    expect(screen.getByTestId('weekCount').textContent).toBe('0')
  })
})
