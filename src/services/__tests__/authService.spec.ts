import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session, User } from '@supabase/supabase-js'

// Mock supabase client module used by the service
vi.mock('@/lib/supabaseClient', () => {
  const supabase = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(),
    },
  }
  return { supabase, default: supabase }
})

import { supabase } from '@/lib/supabaseClient'
import { login, logout, signUp, getCurrentSession, listenAuthChanges } from '../authService'

const mockUser: User = {
  id: 'u_123',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  identities: [],
  factors: [],
}

const mockSession: Session = {
  access_token: 'atk',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'rtk',
  user: mockUser,
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signUp success', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: mockUser, session: null }, error: null } as any)
    const res = await signUp('test@example.com', 'pass')
    expect(res.user?.id).toBe('u_123')
  })

  it('signUp duplicate email', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered', code: 'user_already_exists' },
    } as any)
    await expect(signUp('dup@example.com', 'pass')).rejects.toThrow(/già in uso/i)
  })

  it('login success', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    } as any)
    const res = await login('test@example.com', 'pass')
    expect(res.session.access_token).toBe('atk')
  })

  it('login invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as any)
    await expect(login('x@example.com', 'wrong')).rejects.toThrow(/cred/i)
  })

  it('logout success', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any)
    await expect(logout()).resolves.toBeUndefined()
  })

  it('getCurrentSession returns session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    const session = await getCurrentSession()
    expect(session?.user.id).toBe('u_123')
  })

  it('listenAuthChanges subscribes and unsubscribes', () => {
    const unsubscribe = listenAuthChanges(() => {})
    expect(typeof unsubscribe).toBe('function')
    unsubscribe()
  })

  it('login returns readable error when supabase fails', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', status: 400 },
    })

    const res = await login('nope@example.com', 'wrong')
    expect(res.ok).toBe(false)
    expect(res.error.message).toMatch(/Invalid login credentials/)
  })

  it('login succeeds and returns user/session', async () => {
    const fakeSession = { access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, user: { id: 'u1' }, expires_at: Math.floor(Date.now() / 1000) + 3600 }
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { id: 'u1' }, session: fakeSession },
      error: null,
    })

    const res = await login('ok@example.com', 'pass123456')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.user.id).toBe('u1')
      expect(res.data.session).toBeDefined()
    }
  })

  it('register forwards API error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'User already registered', status: 400 },
    })

    const res = await signUp('exists@example.com', 'pass123456')
    expect(res.ok).toBe(false)
    expect(res.error.message).toMatch(/User already registered/)
  })

  it('logout surfaces error', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: { message: 'Network', status: 0 } })
    const res = await logout()
    expect(res.ok).toBe(false)
    expect(res.error.message).toMatch(/Network/)
  })
})
