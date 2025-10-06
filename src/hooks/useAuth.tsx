import * as React from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}
type AuthAPI = {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): (AuthState & AuthAPI & { isAuthenticated: boolean }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    if (!isSupabaseConfigured()) {
      const msg = 'Supabase not configured: set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
      console.error('[Auth] configuration error:', msg)
      setError(msg)
      setLoading(false)
      return () => { mounted = false }
    }
    ;(async () => {
      try {
        console.log('[Auth] boot: getSession()')
        const { data: sess } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(sess.session ?? null)
        console.log('[Auth] boot: getUser()')
        const { data: usr } = await supabase.auth.getUser()
        if (!mounted) return
        setUser(usr.user ?? null)
      } catch (e: any) {
        console.error('[Auth] boot error:', e?.message || e)
        setError(e?.message || 'Unable to initialize authentication')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      console.info('[useAuth] onAuthStateChange:', _event, { hasSession: !!sess, userId: sess?.user?.id ?? null })
      setSession(sess ?? null)
      setUser(sess?.user ?? null)
    })
    return () => {
      mounted = false
      try { sub.subscription.unsubscribe() } catch {}
    }
  }, [])

  const login = React.useCallback(async (email: string, password: string, _remember?: boolean) => {
    console.log('[Login] submit triggered', email)
    setLoading(true); setError(null)
    if (!isSupabaseConfigured()) {
      const msg = 'Supabase not configured: set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
      console.error('[Login] blocked: invalid configuration', msg)
      setError(msg)
      setLoading(false)
      return
    }
    try {
      console.log('[Login] signInWithPassword called')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('[Login] response:', data, error)
      if (error) {
        const raw = error.message || 'Credenziali non valide'
        const normalized =
          /invalid login credentials/i.test(raw) ? 'Email o password non corretti.' :
          /user not found/i.test(raw) ? 'Utente non trovato.' :
          /network|failed to fetch/i.test(raw) ? 'Impossibile contattare il server di autenticazione.' :
          raw
        setError(normalized)
      } else {
        setUser(data.user)
        setSession(data.session)
        console.log('[Auth] Login success – user authenticated')
      }
    } catch (e: any) {
      console.error('[Login] exception:', e)
      const msg =
        e?.message === 'Failed to fetch'
          ? 'Network error contacting authentication service. Verify configuration.'
          : (e?.message || 'Unexpected error')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = React.useCallback(async (email: string, password: string, _remember?: boolean) => {
    console.log('[Auth] signUp attempt:', email)
    setLoading(true); setError(null)
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured: set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
      setLoading(false)
      return
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    console.log('[Auth] signUp response:', data, error)
    if (error) setError(error.message)
    else { setUser(data.user); setSession(data.session ?? null) }
    setLoading(false)
  }, [])

  const logout = React.useCallback(async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) setError(error.message)
    else { setUser(null); setSession(null) }
    setLoading(false)
  }, [])

  const refreshUser = React.useCallback(async () => {
    const res = await supabase.auth.getUser()
    if (!res.error) setUser(res.data.user)
  }, [])

  return { user, session, loading, error, login, register, logout, refreshUser, isAuthenticated: !!user }
}
