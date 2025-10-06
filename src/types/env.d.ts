/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_ENABLE_REMOTE?: string
  readonly VITE_DEFAULT_LANGUAGE?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_DESCRIPTION?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_REDIRECT_URI?: string
  readonly VITE_GOOGLE_CALENDAR_API_URL?: string
  readonly VITE_WEATHER_API_KEY?: string
  readonly VITE_MISTRAL_API_URL?: string
  readonly VITE_MISTRAL_API_KEY?: string
  readonly VITE_MISTRAL_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
