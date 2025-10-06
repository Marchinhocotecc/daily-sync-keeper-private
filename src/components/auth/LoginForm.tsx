import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { setLanguage } from '@/i18n'

export const LoginForm: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [remember, setRemember] = React.useState(true)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = React.useState(false)

  const validate = () => {
    const next: { email?: string; password?: string } = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      next.email = t('auth.invalidEmail')
    }
    if (password.length < 6) {
      next.password = t('auth.shortPassword')
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[LoginForm] submit triggered')
    setFormError(null)
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password, remember)
    } catch (err: any) {
      console.error('[LoginForm] login failed', err)
      setFormError(err?.message || t('auth.genericLoginError'))
    } finally {
      setLoading(false)
    }
  }

  const onChange = async (nextLng: string) => {
    try {
      await setLanguage(nextLng);
    } catch {
      // swallow to avoid breaking the UI
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      noValidate
      aria-describedby={formError ? 'login-form-error' : undefined}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="auth-language">
          {t('auth.language')}
        </label>
        <select
          id="auth-language"
          className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={i18n.language}
          onChange={(e) => {
            const lng = e.target.value
            onChange(lng)
            try { localStorage.setItem('lang', lng) } catch {} // wrapped safely
          }}
        >
          <option value="en">🇬🇧 English</option>
          <option value="it">🇮🇹 Italiano</option>
          <option value="es">🇪🇸 Español</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="fr">🇫🇷 Français</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="login-email">
          {t('auth.email')}
        </label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={fieldErrors.email ? 'true' : 'false'}
          aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
        />
        {fieldErrors.email && (
          <p
            id="login-email-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="login-password">
          {t('auth.password')}
        </label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={fieldErrors.password ? 'true' : 'false'}
          aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
        />
        {fieldErrors.password && (
          <p
            id="login-password-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="login-remember"
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border focus:ring-2 focus:ring-primary"
        />
        <label htmlFor="login-remember" className="text-sm">
          {t('auth.rememberMe')}
        </label>
      </div>

      {formError && (
        <p
          id="login-form-error"
          className="text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
        aria-busy={loading}
        onClick={() => console.log('Login button clicked')}
      >
        {loading ? t('auth.loggingIn') : t('auth.submitLogin')}
      </Button>
    </form>
  )
}
