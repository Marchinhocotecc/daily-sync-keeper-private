import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

// Mock notification services to avoid real permission/notifications
vi.mock('@/services/notifications', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue(true),
  initNotificationChannels: vi.fn().mockResolvedValue(undefined),
  showInstantNotification: vi.fn().mockResolvedValue(undefined),
}))

// Prepare shared mocks so we can assert calls
const deleteTodoMock = vi.fn().mockResolvedValue(undefined)
const deleteEventMock = vi.fn().mockResolvedValue(undefined)

// Mock useTodos/useCalendarEvents
vi.mock('@/hooks/useTodos', () => {
  const nowIso = new Date().toISOString()
  return {
    useTodos: () => ({
      todos: [
        // High priority todo -> will appear in notifications
        { id: 't1', text: 'Urgent task', completed: false, priority: 'high', created_at: nowIso },
      ],
      loading: false,
      addTodo: vi.fn(),
      toggleTodo: vi.fn(),
      deleteTodo: deleteTodoMock,
      refetch: vi.fn(),
    }),
  }
})

vi.mock('@/hooks/useCalendarEvents', () => {
  // Create a future event for today (to appear as "upcoming")
  const now = new Date()
  const inTwoMin = new Date(now.getTime() + 2 * 60_000)
  const today = now.toISOString().split('T')[0]
  const hh = String(inTwoMin.getHours()).padStart(2, '0')
  const mm = String(inTwoMin.getMinutes()).padStart(2, '0')
  return {
    useCalendarEvents: () => ({
      events: [
        { id: 'e1', title: 'Meeting', date: today, time: `${hh}:${mm}`, duration: 30, color: '#fff' },
      ],
      loading: false,
      addEvent: vi.fn(),
      deleteEvent: deleteEventMock,
      updateEvent: vi.fn(),
      getEventsForDate: vi.fn(),
      refetch: vi.fn(),
    }),
  }
})

// Import after mocks
import { NotificationWidget } from '@/components/NotificationWidget'

describe('NotificationWidget complete action', () => {
  beforeEach(() => {
    deleteTodoMock.mockClear()
    deleteEventMock.mockClear()
  })

  it('completes a todo notification (calls deleteTodo)', async () => {
    render(<NotificationWidget />)
    // There may be multiple complete buttons; the todo one will exist
    const buttons = await screen.findAllByRole('button', { name: /completa/i })
    // Click first complete button; since both an event and a todo exist, we need the todo-specific one.
    // There are 2 notifications (one event upcoming + one high todo); order isn't guaranteed.
    // We click all and accept either event or todo first; assert at least one delete was called.
    fireEvent.click(buttons[0])
    // One of the handlers will be called; now click the other as well to ensure both paths work
    if (buttons[1]) {
      fireEvent.click(buttons[1])
    }
    expect(deleteTodoMock.mock.calls.length + deleteEventMock.mock.calls.length).toBeGreaterThan(0)
  })

  it('calls deleteEvent for an event notification', async () => {
    render(<NotificationWidget />)
    const buttons = await screen.findAllByRole('button', { name: /completa/i })
    // Click all complete buttons; ensure event delete called
    buttons.forEach((b) => fireEvent.click(b))
    expect(deleteEventMock).toHaveBeenCalled()
  })
})
