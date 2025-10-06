import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SettingsPage from '@/pages/SettingsPage'
import GlobalStateProvider from '@/state/global/GlobalStateProvider'
import i18n from '@/i18n'

const upsertMock = vi.fn()
const authGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u-test' } } })

vi.mock('@/lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: authGetUser,
    },
    from: vi.fn((table: string) => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: { code: 'PGRST116' } }) }) }),
      upsert: upsertMock.mockResolvedValue({ error: null }),
    })),
    storage: { from: () => ({ upload: vi.fn(), getPublicUrl: () => ({ data: { publicUrl: 'x' } }) }) },
  },
}))

vi.mock('@/hooks/useProfile', () => {
  const React = require('react')
  return {
    useProfile: () => ({
      profile: { user_id: 'u-test', username: null, avatar_url: null, language: 'en', theme: 'light' },
      loading: false,
      error: null,
      refresh: vi.fn(),
      upsert: upsertMock,
      uploadAvatar: vi.fn(),
    }),
  }
})

describe('SettingsPage language change', () => {
  beforeEach(() => {
    upsertMock.mockClear()
  })

  it('changes language immediately & persists via upsert', async () => {
    render(
      <GlobalStateProvider>
        <SettingsPage />
      </GlobalStateProvider>
    )
    expect(screen.getByText(/Settings|Impostazioni/)).toBeInTheDocument()
    const itBtn = screen.getByText('Italiano')
    await act(async () => {
      fireEvent.click(itBtn)
    })
    // Wait microtask for changeLanguage
    await Promise.resolve()
    expect(i18n.language).toBe('it')
    expect(screen.getByText('Impostazioni')).toBeInTheDocument()
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ language: 'it' }))
  })
})
