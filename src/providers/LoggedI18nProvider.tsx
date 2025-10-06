import React, { useEffect, PropsWithChildren, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { loadLanguageNamespaces } from '@/i18n'
import { namespaces } from '@/i18n/namespaces'

export const LoggedI18nProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    async function ensure(lang: string) {
      setReady(false)
      console.log('[I18nProvider] loading namespaces for', lang, namespaces)
      await loadLanguageNamespaces(lang)
      if (active) {
        setReady(true)
        console.log('[I18nProvider] ready language:', i18n.language)
      }
    }
    void ensure(i18n.language)
    const listener = (lng: string) => void ensure(lng)
    i18n.on('languageChanged', listener)
    return () => {
      active = false
      i18n.off('languageChanged', listener)
    }
  }, [])

  if (!ready) return <div>Loading translations…</div>

  return (
    <I18nextProvider i18n={i18n}>
      {children ?? <div>Fallback content (i18n)</div>}
    </I18nextProvider>
  )
}

export default LoggedI18nProvider
