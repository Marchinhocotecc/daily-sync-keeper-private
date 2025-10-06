import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { useAuthSlice } from '@/state/global/GlobalStateProvider'
import { useTranslation } from 'react-i18next'

const LoginPage: React.FC = () => {
  const { user } = useAuthSlice()
  const isAuthenticated = !!user
  const navigate = useNavigate()
  const location = useLocation() as any
  const { t } = useTranslation()
  const tr = (k: string, fb: string) => (t(k) === k ? fb : t(k))
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (isAuthenticated) {
      const to = location?.state?.from?.pathname || '/'
      navigate(to, { replace: true })
    }
  }, [isAuthenticated, location, navigate])

  const signInWithGoogle = async () => {
    console.log('[LoginForm] submit triggered')
    if (!configured) {
      console.error('[LoginForm] blocked: Supabase not configured')
      return
    }
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-6 rounded-2xl border bg-background">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {tr('auth.loginTitle', 'Accedi')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {tr('auth.loginSubtitle', 'Per continuare, effettua l’accesso.')}
        </p>
        {!configured && (
          <div className="mb-3 text-sm text-destructive">
            Supabase non configurato: imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env.local
          </div>
        )}
        <button
          onClick={signInWithGoogle}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-95 transition"
          disabled={!configured}
        >
          {tr('auth.continueWithGoogle', 'Continua con Google')}
        </button>
      </div>
    </div>
  )
}

export default LoginPage
