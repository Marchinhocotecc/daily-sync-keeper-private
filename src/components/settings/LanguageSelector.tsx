import React, { useState } from 'react'
import i18n, { supportedLanguages } from '@/i18n'
import { usePreferencesSlice } from '@/state/global/GlobalStateProvider'
import { useProfile } from '@/hooks/useProfile'

export const LanguageSelector: React.FC = () => {
  const { setLanguage, language } = usePreferencesSlice()
  const { upsert } = useProfile()
  const [saving, setSaving] = useState<string | null>(null)

  const handle = async (lng: string) => {
    if (lng === language) return
    setSaving(lng)
    try {
      await i18n.changeLanguage(lng)
      setLanguage(lng)
      try { localStorage.setItem('lang', lng) } catch {}
      await upsert({ language: lng })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">{i18n.t('settings.language')}</h3>
      <div className="flex flex-wrap gap-2">
        {supportedLanguages.map(l => {
          const active = l.code === language
            return (
              <button
                key={l.code}
                onClick={() => handle(l.code)}
                disabled={saving === l.code}
                className={`px-3 py-1 rounded border text-sm transition
                  ${active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
              >
                <span className="mr-1">{l.flag}</span>
                {l.nativeName}
                {saving === l.code && '…'}
              </button>
            )
        })}
      </div>
    </div>
  )
}

export default LanguageSelector
