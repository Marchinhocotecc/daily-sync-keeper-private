import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { namespaces } from '@/i18n/namespaces';

void i18n
  .use(initReactI18next)
  .init({
    resources: {},            // dynamic loading
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: namespaces,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }, // manual loading control in provider
  });

// Dynamically load all configured namespaces for a language.
export async function loadLanguageNamespaces(lng: string) {
  await Promise.all(
    namespaces.map(async (ns) => {
      if (!i18n.hasResourceBundle(lng, ns)) {
        const mod = await import(
          /* @vite-ignore */ `@/i18n/locales/${lng}/${ns}.json`
        ).catch(() => null);
        if (mod?.default) {
          i18n.addResourceBundle(lng, ns, mod.default, true, true);
        }
      }
    })
  );
}

/**
 * Safe language switch + dynamic resources ensure.
 */
export async function setLanguage(lng: string) {
  await loadLanguageNamespaces(lng);
  if (typeof (i18n as any)?.changeLanguage === 'function') {
    await i18n.changeLanguage(lng);
  } else {
    (i18n as any).language = lng;
    (i18n as any).resolvedLanguage = lng;
    i18n.emit?.('languageChanged', lng);
  }
}

export const supportedLanguages = [
  { code: 'en', nativeName: 'English', flag: '🇬🇧' },
  { code: 'it', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
];

export default i18n;
