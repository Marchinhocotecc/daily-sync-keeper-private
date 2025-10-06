import React, { useState, useEffect } from 'react'
import { useAuthSlice, usePreferencesSlice } from '@/state/global/GlobalStateProvider'
import { HAS_ALL_REQUIRED, MISSING_REQUIRED, VITE_GOOGLE_CLIENT_ID } from '@/config/env'

/**
 * Pagina di login con Google OAuth (Supabase).
 * Flusso:
 * 1. L'utente clicca il bottone -> log "[Auth][Google] click".
 * 2. Chiamiamo actions.auth.loginWithGoogle() -> avvio redirect.
 * 3. Supabase gestisce redirect e ritorno /auth/callback.
 * 4. onAuthStateChange (in GlobalStateProvider) emette log e aggiorna stato globale.
 * 5. Al successo redirect manuale verso /dashboard se già autenticato.
 */
const Login: React.FC = () => {
  const { isAuthenticated, loginWithGoogle } = useAuthSlice() as any
  const { language } = usePreferencesSlice()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Redirect if already logged
  useEffect(() => {
    if (isAuthenticated) {
      console.info('[Login][Redirect] Utente già autenticato → /dashboard')
      window.location.replace('/dashboard')
    }
  }, [isAuthenticated])

  const disabled = !HAS_ALL_REQUIRED || pending

  const handleGoogle = async () => {
    console.info('[Login][UI] Click bottone Google')
    if (disabled) {
      console.warn('[Login][UI] Bottone disabilitato - env incompleta o pending')
      return
    }
    setError(null)
    setPending(true)
    try {
      await loginWithGoogle()
      // Non arriveremo oltre perché supabase farà redirect (data.url)
      // Se per qualche motivo non redirige, mostriamo un avviso.
      setTimeout(() => {
        if (!isAuthenticated) {
          console.warn('[Login][Timeout] Nessun redirect ancora. Controllare popup-blocker.')
        }
      }, 4000)
    } catch (e: any) {
      console.error('[Login][Errore] Eccezione durante loginWithGoogle', e)
      setError(e?.message || 'Login fallito')
      setPending(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Login</h1>
      <p style={{ marginTop: 0, color: '#555' }}>
        {language === 'it' ? 'Accedi con il tuo account Google.' : 'Sign in with your Google account.'}
      </p>

      {!HAS_ALL_REQUIRED && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <strong>Configurazione incompleta.</strong><br />
          Mancano variabili: {MISSING_REQUIRED.join(', ')}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleGoogle}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.6 : 1,
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #ddd',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {pending ? 'Attendere…' : 'Continua con Google'}
      </button>

      <div style={{ marginTop: 16, fontSize: 12, color: '#777' }}>
        Google Client ID: {VITE_GOOGLE_CLIENT_ID ? '✅' : '❌'}
      </div>
    </div>
  )
}

export default Login
