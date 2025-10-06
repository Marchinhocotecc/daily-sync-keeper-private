import React, { useState } from 'react'
import i18n from '@/i18n'
import { usePreferencesSlice } from '@/state/global/GlobalStateProvider'
import { useProfile } from '@/hooks/useProfile'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = usePreferencesSlice()
  const { upsert } = useProfile()
  const [saving, setSaving] = useState(false)

  const apply = async (next: 'light' | 'dark') => {
    if (next === theme) return
    setSaving(true)
    setTheme(next)
    try { localStorage.setItem('theme', next) } catch {}
    document.documentElement.classList.toggle('dark', next === 'dark')
    try { await upsert({ theme: next }) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">{i18n.t('settings.theme')}</h3>
      <div className="flex gap-3">
        {(['light','dark'] as const).map(opt => {
          const active = opt === theme
          return (
            <button
              key={opt}
              onClick={() => apply(opt)}
              disabled={saving}
              className={`px-4 py-1 rounded border text-sm ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {i18n.t(`settings.themes.${opt}`)}
              {saving && active && '…'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeToggle
