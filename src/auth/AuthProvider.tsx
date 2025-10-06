import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { VITE_GOOGLE_REDIRECT_URI } from '@/config/env'

interface AuthCtx {
  user: any | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const mapUser = (u: any) => {
    if (!u) return null
    return {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
      avatar: u.user_metadata?.avatar_url || null
    }
  }

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.warn('[AuthProvider] Supabase not configured; skipping session refresh')
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.getSession()
    console.log('[AuthProvider][getSession]', { session: data?.session, error })
    if (error) console.error('[AuthProvider][getSession][error]', error)
    setUser(mapUser(data?.session?.user))
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshSession()
    if (!isSupabaseConfigured()) return
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider][onAuthStateChange]', event, session)
      setUser(mapUser(session?.user))
    })
    return () => sub.subscription.unsubscribe()
  }, [refreshSession])

  const loginWithGoogle = async () => {
    try {
      console.log('[AuthProvider][loginWithGoogle] starting')
      const redirectTo = VITE_GOOGLE_REDIRECT_URI || window.location.origin
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      })
      console.log('[AuthProvider][loginWithGoogle][result]', { data, error })
      if (error) {
        console.error('[AuthProvider][loginWithGoogle][error]', error)
        throw error
      }
      if (!data || !data.url) {
        console.warn('[AuthProvider][loginWithGoogle] missing redirect url')
        return
      }
      window.location.assign(data.url)
    } catch (e) {
      console.error('[AuthProvider][loginWithGoogle][exception]', e)
    }
  }

  const logout = async () => {
    try {
      console.log('[AuthProvider][logout] starting')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[AuthProvider][logout][error]', error)
      }
    } catch (e) {
      console.error('[AuthProvider][logout][exception]', e)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
