import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GlobalStateProvider, { usePreferencesSlice } from '@/state/global/GlobalStateProvider'
import i18n from '@/i18n'

vi.mock('@/lib/supabaseClient', () => {
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
  return {
    default: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'uid' } } }),
      },
      from: vi.fn(() => ({ upsert })),
      // expose spy for assertions
      __upsert: upsert,
    },
  }
})

const TestComp = () => {
  const { setLanguage } = usePreferencesSlice()
  return React.createElement('button', { onClick: () => setLanguage('it') }, 'change')
}

describe('language change', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls i18n.changeLanguage and persists to supabase', async () => {
    const spy = vi.spyOn(i18n, 'changeLanguage').mockResolvedValue(i18n as any)
    const supabase: any = (await import('@/lib/supabaseClient')).default

    render(
      <GlobalStateProvider>
        <TestComp />
      </GlobalStateProvider>
    )

    fireEvent.click(screen.getByText('change'))

    // allow promises
    await Promise.resolve()

    expect(spy).toHaveBeenCalledWith('it')
    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(supabase.__upsert).toHaveBeenCalledWith({ user_id: 'uid', language: 'it' }, { onConflict: 'user_id' })
  })
})
