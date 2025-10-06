// Minimal, centralized env access. No process/env mirroring, no app-level "AppEnv" object.

// Helpers
const bool = (v: string | boolean | undefined, d = false) =>
  typeof v === 'boolean' ? v : v ? ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()) : d

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_GOOGLE_CLIENT_ID'] as const
const optional = [
  'VITE_GOOGLE_REDIRECT_URI',
  'VITE_GOOGLE_CALENDAR_API_URL',
  'VITE_MISTRAL_API_URL',
  'VITE_ENABLE_REMOTE',
  'VITE_DEFAULT_LANGUAGE',
  'VITE_APP_NAME',
  'VITE_APP_DESCRIPTION',
  'VITE_AI_API_KEY',
  'VITE_MISTRAL_MODEL',
  'VITE_WEATHER_API_KEY',
] as const

type RequiredKey = typeof required[number]
type OptionalKey = typeof optional[number]

const E = import.meta.env as Record<string, string | boolean | undefined>

// Export individual, typed constants (no big object to avoid stale bundle inlining)
export const VITE_SUPABASE_URL = (E.VITE_SUPABASE_URL as string | undefined) || undefined
export const VITE_SUPABASE_ANON_KEY = (E.VITE_SUPABASE_ANON_KEY as string | undefined) || undefined
export const VITE_GOOGLE_CLIENT_ID = (E.VITE_GOOGLE_CLIENT_ID as string | undefined) || undefined
export const VITE_WEATHER_API_KEY = (E.VITE_WEATHER_API_KEY as string | undefined) || undefined
export const VITE_GOOGLE_REDIRECT_URI = (E.VITE_GOOGLE_REDIRECT_URI as string | undefined) || undefined
export const VITE_GOOGLE_CALENDAR_API_URL = (E.VITE_GOOGLE_CALENDAR_API_URL as string | undefined) || undefined

// AI config
const _AI_PRIMARY = (E.VITE_MISTRAL_API_KEY as string | undefined) || ''
const _AI_ALIAS = (E.VITE_AI_API_KEY as string | undefined) || ''
export const AI_API_KEY: string = (_AI_PRIMARY || _AI_ALIAS).trim()

export const MISTRAL_API_URL: string =
  ((E.VITE_MISTRAL_API_URL as string | undefined) || 'https://api.mistral.ai/v1').trim()

export const MISTRAL_MODEL: string =
  ((E.VITE_MISTRAL_MODEL as string | undefined) || 'mistral-large-latest').trim()

// Convenience flags
export const ENABLE_REMOTE = bool(E.VITE_ENABLE_REMOTE, false)
export const DEFAULT_LANGUAGE = (E.VITE_DEFAULT_LANGUAGE as string | undefined) || 'en'
export const APP_NAME = (E.VITE_APP_NAME as string | undefined) || 'Daily-sync-keeper'
export const APP_DESCRIPTION =
  (E.VITE_APP_DESCRIPTION as string | undefined) ||
  'Your personal assistant for managing daily tasks, weather updates, and calendar events seamlessly.'

// Validation
export const MISSING_REQUIRED: string[] = required.filter(k => !((E as any)[k] && String((E as any)[k]).trim()))
export const HAS_ALL_REQUIRED = MISSING_REQUIRED.length === 0
export const OPTIONAL_MISSING: OptionalKey[] = optional.filter(k => !(E as any)[k]) as OptionalKey[]

// AI-specific required keys
const MISTRAL_REQUIRED = ['VITE_MISTRAL_API_KEY'] as const
export const MISTRAL_MISSING_REQUIRED: string[] = MISTRAL_REQUIRED.filter(k => !((E as any)[k]))
export const MISTRAL_HAS_ALL_REQUIRED = MISTRAL_MISSING_REQUIRED.length === 0

// Small helper for guarded reads (kept for convenience)
export function getEnv(key: string, fallback?: string): string | undefined {
  const v = (E as any)[key]
  return (v === undefined || v === null || v === '') ? fallback : (v as string)
}

// Removed (stale): AppEnv, EnvValidation, ENV bulk export and noisy console logs.

/**
 * Centralized environment configuration for Vite + React.
 * - Only variables prefixed with VITE_ are exposed to the client.
 * - Throws at startup if any required variable is missing.
 */

export const requiredKeys = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

export type RequiredEnvKey = typeof requiredKeys[number];

type Env = Record<RequiredEnvKey, string>;

// Read raw values from Vite's import.meta.env
const raw: Partial<Record<RequiredEnvKey, string | undefined>> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

// Runtime guard: throw if any required var is missing/empty
const missing = requiredKeys.filter(
  (k) => !raw[k] || String(raw[k]).trim() === ''
);

if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(
      ', '
    )}. Ensure they are set in .env.local or your runtime environment.`
  );
}

/**
 * Strongly-typed, validated environment values.
 */
export const env: Env = {
  VITE_SUPABASE_URL: raw.VITE_SUPABASE_URL!,
  VITE_SUPABASE_ANON_KEY: raw.VITE_SUPABASE_ANON_KEY!,
} as const;
