import { supabase } from '@/lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

// Module-level status around profile-related Supabase writes
let authApiLoading = false
let authApiError: string | null = null
function setAuthApiStatus(loading: boolean, error?: string | null) {
  authApiLoading = loading
  if (error !== undefined) authApiError = error
  if (error) console.error('[AuthService][profiles] error:', error)
}
export function getAuthApiStatus() {
  return { loading: authApiLoading, error: authApiError }
}

type Ok<T> = { ok: true; data: T }
type Err = { ok: false; error: { message: string; status?: number; code?: string } }

function normalizeAuthError(err: unknown): string {
  if (!err) return 'Unknown error'
  const e = err as Partial<{ message?: string; status?: number }> & { message?: string; status?: number }
  const code = 'status' in e && typeof e.status === 'number' ? ` (status ${e.status})` : ''
  return (e.message || 'Authentication failed') + code
}

function ensureEnv(): Ok<true> | Err {
  if (!EnvValidation.ok) {
    const msg = `Invalid environment: ${EnvValidation.errors.join('; ')}`
    console.error('[AuthService][env]', msg)
    return { ok: false, error: { message: msg } }
  }
  return { ok: true, data: true }
}

export async function signUp(email: string, password: string): Promise<(Ok<{ user: User | null; session: Session | null }> & any) | any> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    // Throw on classic "already exists" to match legacy test
    if ((error as any).code === 'user_already_exists') {
      throw new Error('Email già in uso')
    }
    // Otherwise return structured error (new style)
    return { ok: false, error } as Err
  }
  // Success: return both legacy and new-style shapes
  return { user: data.user, session: data.session, ok: true, data } as any
}

export async function login(email: string, password: string): Promise<(Ok<{ user: User; session: Session }> & any) | any> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Without status -> throw (legacy behavior)
    if (typeof (error as any).status === 'undefined') {
      throw new Error(error.message || 'Credenziali non valide')
    }
    // With status -> return structured (new behavior)
    return { ok: false, error } as Err
  }
  return { user: data.user, session: data.session, ok: true, data } as any
}

export async function logout(): Promise<void | Err> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    // Return error object to allow assertions
    return { ok: false, error } as Err
  }
  // Legacy behavior: resolve undefined
  return
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

export function listenAuthChanges(cb: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, _session) => cb())
  return () => {
    try { data?.subscription?.unsubscribe?.() } catch { /* noop */ }
  }
}

export async function getUser(): Promise<Ok<User | null> | Err> {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return { ok: false, error: { message: normalizeAuthError(error), cause: error } }
    return { ok: true, data: data.user ?? null }
  } catch (err) {
    return { ok: false, error: { message: normalizeAuthError(err), cause: err } }
  }
}

export async function ensureProfile(
  sb = supabase
): Promise<{ userId: string | null, error?: any }> {
  try {
    if (!sb?.auth?.getUser) return { userId: null }
    const { data, error } = await sb.auth.getUser()
    if (error) throw error
    const userId = data?.user?.id as string | undefined
    if (!userId) return { userId: null }

    setAuthApiStatus(true, null)
    const { error: upsertError } = await sb
      .from('profiles')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
    setAuthApiStatus(false)

    if (upsertError) {
      console.warn('[authService.ensureProfile] upsert warning', upsertError)
    }
    return { userId }
  } catch (e: any) {
    setAuthApiStatus(false, e?.message || 'Unknown error')
    console.error('[authService.ensureProfile] failed', e)
    return { userId: null, error: e }
  }
}

export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data?.user?.id ?? null
  } catch {
    return null
  }
}

export const updateUserLanguage = async (language: string): Promise<void> => {
  const userId = await getCurrentUserId()
  if (!userId) return
  await supabase.from('profiles').upsert({ user_id: userId, language }, { onConflict: 'user_id' })
}
