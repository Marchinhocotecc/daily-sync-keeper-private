import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CalendarPage from '@/pages/CalendarPage'

// i18n mock
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => {
      if (opts?.count !== undefined) return `${k}:${opts.count}`
      if (opts?.date) return `${k}:${opts.date}`
      if (opts?.m) return `${k}:${opts.m}`
      if (opts?.title) return `${k}:${opts.title}`
      return k
    },
  }),
}))

// Auth + global slice mocks
vi.mock('@/state/global/GlobalStateProvider', () => ({
  useCalendarSlice: () => ({ events: [], refetch: vi.fn() }),
  useAuthSlice: () => ({ user: { id: 'u1' } }),
}))

// Simple in-memory supabase mock
const db: any[] = []
const fromMock = vi.fn().mockImplementation((_table: string) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  insert: vi.fn().mockImplementation((rows: any[]) => {
    db.push(...rows)
    return { select: () => ({ single: () => ({ data: rows[0], error: null }) }) }
  }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
}))
vi.mock('@/lib/supabaseClient', () => ({
  default: { from: fromMock },
}))

describe('CalendarPage integration', () => {
  beforeEach(() => {
    db.splice(0, db.length)
    vi.clearAllMocks()
  })

  it('creates an event through the form and shows it in day list (day mode)', async () => {
    render(<CalendarPage />)
    // Switch to day mode
    fireEvent.click(screen.getByRole('button', { name: /calendar.mode.day/i }))
    // Open form
    fireEvent.click(screen.getByRole('button', { name: /calendar.newEvent/i }))
    // Fill inputs
    const titleInput = screen.getByLabelText(/calendar.form.title/i)
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'My Event' } })
    })
    const durationInput = screen.getByDisplayValue('60')
    fireEvent.change(durationInput, { target: { value: '45' } })
    // Submit
    const createBtn = screen.getByRole('button', { name: /common.create/i })
    await act(async () => {
      fireEvent.click(createBtn)
    })
    // Modal closes
    expect(screen.queryByRole('dialog')).toBeNull()
    // Event appears (title text somewhere)
    const possible = screen.getAllByText(/My Event/)
    expect(possible.length).toBeGreaterThan(0)
  })
})
