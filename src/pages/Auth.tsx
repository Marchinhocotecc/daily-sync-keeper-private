import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

const tabClass = (active: boolean) =>
  `flex-1 justify-center rounded-md border transition focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium ${
    active
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-background text-primary border-primary hover:bg-primary/5'
  }`

export const AuthPage: React.FC = () => {
  const { t } = useTranslation()
  const [tab, setTab] = React.useState<'login' | 'register'>('login')
  const panelId = tab === 'login' ? 'auth-panel-login' : 'auth-panel-register'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div
          className="flex gap-2 mb-4"
          role="tablist"
          aria-label={t('auth.authTabs') || 'Authentication tabs'}
        >
          <Button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            aria-controls="auth-panel-login"
            id="auth-tab-login"
            variant={tab === 'login' ? 'default' : 'outline'}
            className={tabClass(tab === 'login')}
            onClick={() => setTab('login')}
          >
            {t('auth.login')}
          </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={tab === 'register'}
              aria-controls="auth-panel-register"
              id="auth-tab-register"
              variant={tab === 'register' ? 'default' : 'outline'}
              className={tabClass(tab === 'register')}
              onClick={() => setTab('register')}
            >
              {t('auth.register')}
            </Button>
        </div>
        <Card
          aria-labelledby={tab === 'login' ? 'auth-tab-login' : 'auth-tab-register'}
        >
          <CardHeader>
            <h1 className="text-xl font-semibold leading-snug text-primary">
              {tab === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h1>
          </CardHeader>
          <CardContent
            id={panelId}
            role="tabpanel"
            aria-labelledby={tab === 'login' ? 'auth-tab-login' : 'auth-tab-register'}
            tabIndex={0}
          >
            {tab === 'login' ? <LoginForm /> : <RegisterForm />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuthPage
