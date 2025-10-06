/* @refresh skip */
/* Centralized Supabase client with hardened env reading and simple diagnostics */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Guard function to check env presence
export const isSupabaseConfigured = (): boolean =>
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Create the client (tests often mock this module)
const client: SupabaseClient = createClient(
  url || 'https://example.invalid',
  anonKey || 'public-anon-key'
)

// NETWORK / REFRESH GUARD ----------------------------------------------------
// Goal: give clearer diagnostics and a light retry for transient refresh failures
if (typeof window !== 'undefined') {
  const NET_ERR_RE = /quic|network|failed to fetch|ecconnrefused|etimedout/i

  async function refreshWithRetry(max = 3, baseDelay = 2000) {
    for (let attempt = 1; attempt <= max; attempt++) {
      try {
        const { error } = await client.auth.refreshSession()
        if (!error) {
          if (attempt > 1) console.info('[supabase][auth] refresh recovered on attempt', attempt)
          return
        }
        if (!NET_ERR_RE.test(error.message)) {
          // Non-network auth error: stop retrying
          return
        }
        console.warn(`[supabase][auth] network refresh error (attempt ${attempt}/${max}):`, error.message)
      } catch (e: any) {
        if (!NET_ERR_RE.test(String(e?.message || ''))) return
        console.warn(`[supabase][auth] thrown network refresh error (attempt ${attempt}/${max}):`, e?.message)
      }
      if (attempt < max) {
        await new Promise(r => setTimeout(r, baseDelay * attempt))
      }
    }
    console.warn('[supabase][auth] giving up refresh retries')
  }

  // Passive initial session probe
  client.auth.getSession().then(({ error }) => {
    if (error && NET_ERR_RE.test(error.message)) {
      console.warn('[supabase][auth] initial session fetch network issue – scheduling retry')
      refreshWithRetry()
    }
  }).catch(e => {
    if (NET_ERR_RE.test(String(e?.message))) {
      console.warn('[supabase][auth] initial session throw – scheduling retry')
      refreshWithRetry()
    }
  })

  // Retry opportunistically when connectivity or visibility returns
  window.addEventListener('online', () => refreshWithRetry(2, 1500))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshWithRetry(2, 1500)
  })
}

// Export both named and default for compatibility across the codebase/tests
export const supabase = client
export default client
