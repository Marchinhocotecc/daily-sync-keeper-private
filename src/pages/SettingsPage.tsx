import React from 'react'
import i18n from '@/i18n'
import { LanguageSelector } from '@/components/settings/LanguageSelector'
import { ThemeToggle } from '@/components/settings/ThemeToggle'
import { ProfileEditor } from '@/components/settings/ProfileEditor'
import { useProfile } from '@/hooks/useProfile'
import { usePreferencesSlice } from '@/state/global/GlobalStateProvider'
import { loadUserSettings, upsertUserSettings, updateUserNotifications, updateUserTheme } from '@/services/settingsService'
import { safeIndexOf } from '@/utils/safeIncludes' // added

const SettingsPage: React.FC = () => {
  const { loading, error } = useProfile()
  const prefs = usePreferencesSlice()
  const [settingsLoading, setSettingsLoading] = React.useState(true)
  const [settingsError, setSettingsError] = React.useState<string | null>(null)
  const [notif, setNotif] = React.useState<boolean>(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        setSettingsLoading(true)
        const s = await loadUserSettings()
        if (s) {
          if (s.language && s.language !== prefs.language) prefs.setLanguage(s.language)
          if (s.theme && s.theme !== prefs.theme) prefs.setTheme(s.theme as any)
          if (typeof s.notifications_enabled === 'boolean') setNotif(s.notifications_enabled)
        }
      } catch (e: any) {
        setSettingsError(e?.message || 'Impossibile caricare le preferenze')
      } finally {
        setSettingsLoading(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleNotifications = async () => {
    const next = !notif
    setNotif(next)
    try { await updateUserNotifications(next) } catch {}
    prefs.setNotificationsEnabled(next)
  }

  const cycleTheme = async () => {
    const order: any[] = ['system', 'light', 'dark']
    const idx = safeIndexOf(order, prefs.theme as any) // safer than order.indexOf(...)
    const next = order[(idx + 1) % order.length]
    prefs.setTheme(next)
    try { await updateUserTheme(next) } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">{i18n.t('settings.title')}</h1>
      {loading && <div className="text-sm text-gray-500">Loading profile…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <LanguageSelector />
          <ThemeToggle />
          <div className="border rounded-md p-4 space-y-3">
            <h2 className="font-semibold text-sm">{i18n.t('settings.preferences', 'Preferenze')}</h2>
            {settingsLoading && (
              <div className="text-xs text-gray-500 animate-pulse">
                {i18n.t('common.loading', 'Loading...')}
              </div>
            )}
            {settingsError && (
              <div className="text-xs text-red-600">
                {settingsError}
              </div>
            )}
            {!settingsLoading && !settingsError && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{i18n.t('settings.notifications', 'Notifiche')}</span>
                  <button
                    onClick={toggleNotifications}
                    className={`text-xs px-2 py-1 rounded border transition ${
                      notif
                        ? 'bg-green-500/10 border-green-500 text-green-600'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                    aria-pressed={notif}
                  >
                    {notif
                      ? i18n.t('common.enabled', 'On')
                      : i18n.t('common.disabled', 'Off')}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{i18n.t('settings.theme.cycle', 'Tema')}</span>
                  <button
                    onClick={cycleTheme}
                    className="text-xs px-2 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                  >
                    {i18n.t('settings.theme.current', 'Tema:')} {prefs.theme}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <ProfileEditor />
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
