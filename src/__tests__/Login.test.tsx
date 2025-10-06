import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '@/components/auth/Login'
import { GlobalStateProvider } from '@/state/global/GlobalStateProvider'
import * as envModule from '@/config/env'
import supabase from '@/lib/supabaseClient'

// Mock env to be complete
jest.spyOn(envModule, 'HAS_ALL_REQUIRED', 'get').mockReturnValue(true)
jest.spyOn(envModule, 'MISSING_REQUIRED', 'get').mockReturnValue([])
jest.spyOn(envModule, 'VITE_GOOGLE_CLIENT_ID', 'get').mockReturnValue('fake-id')

// Mock supabase signInWithOAuth
const signInMock = jest.spyOn(supabase.auth, 'signInWithOAuth')

const renderPage = () =>
  render(
    <GlobalStateProvider>
      <Login />
    </GlobalStateProvider>
  )

describe('Login page', () => {
  beforeEach(() => {
    signInMock.mockReset()
  })

  it('renders button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /continua con google/i })).toBeInTheDocument()
  })

  it('successful login initiates redirect', async () => {
    signInMock.mockResolvedValue({ data: { url: 'https://redirect.example' }, error: null } as any)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continua con google/i }))
    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1))
  })

  it('shows error on failure', async () => {
    signInMock.mockResolvedValue({ data: null, error: { message: 'Auth failed' } } as any)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continua con google/i }))
    await waitFor(() => screen.getByText(/Auth failed/))
    expect(screen.getByText(/Auth failed/)).toBeInTheDocument()
  })
})
