import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GlobalStateProvider, useCalendarSlice } from '@/state/global/GlobalStateProvider'

vi.mock('@/i18n', () => ({
  default: { language: 'it', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
}))
vi.mock('@/lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}))

const Harness: React.FC = () => {
  const { events, addEvent } = useCalendarSlice()
  return (
    <div>
      <div data-testid="count">{events.length}</div>
      <button onClick={() => addEvent('Demo', '2030-01-01', '09:30', 45, '#123')}>
        add
      </button>
    </div>
  )
}

describe('Calendar event creation', () => {
  it('adds event through slice', async () => {
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
})
