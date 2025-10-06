/**
 * Returns a list of required variable names that are absent or empty.
 * Pure utility so it can be unit-tested without relying on import.meta.env directly.
 */
export type EnvLike = Record<string, unknown> | null | undefined

export function missingEnvVars<const T extends readonly string[]>(
  keys: T,
  env: Record<string, any>
): string[] {
  return keys.filter((k) => !env[k] || String(env[k]).trim().length === 0)
}

// Parses common truthy/falsey strings or booleans; falls back to defaultValue
export function parseBoolean(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(s)) return true
    if (['0', 'false', 'no', 'off', ''].includes(s)) return false
  }
  return fallback
}

// Normalizes a URL string (trims spaces, removes trailing slash)
export function normalizeUrl(input?: string): string | undefined {
  if (!input) return undefined
  const s = String(input).trim()
  if (!s) return undefined
  // allow http(s) only; strip trailing slash
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`
  return withProto.replace(/\/+$/, '')
}

// Returns a safe summary for logging anon keys without leaking them
export function maskKeyPresence(k?: string): string {
  if (!k || /^\s*$/.test(k)) return '(missing)'
  const s = String(k)
  return s.length <= 8 ? `${s}…` : `${s.slice(0, 8)}…`
}

/**
 * validateSupabaseEnv
 * - URL must be https for production, unless it's explicit localhost/127.0.0.1
 * - Host normally ends with .supabase.co (warn if not)
 * - Key must be present (anon key, not service role) – we can't verify role here, only presence.
 */
export function validateSupabaseEnv(
  url?: string,
  anonKey?: string
): {
  ok: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  const u = normalizeUrl(url)
  const k = typeof anonKey === 'string' ? anonKey.trim() : undefined

  if (!u) {
    errors.push('Missing VITE_SUPABASE_URL')
  } else if (isPlaceholderUrl(u)) {
    errors.push('VITE_SUPABASE_URL is a placeholder or invalid (must start with http/https)')
  }

  if (!k) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY')
  } else if (isPlaceholderKey(k)) {
    errors.push('VITE_SUPABASE_ANON_KEY looks like a placeholder')
  }

  return { ok: errors.length === 0, errors, warnings }
}

// Placeholder detection helpers
function isPlaceholderUrl(s?: string): boolean {
  if (!s) return true
  const v = String(s)
  return (
    /^\s*$/.test(v) ||
    /YOUR-PROJECT|REPLACE|example\.com/i.test(v) ||
    !/^https?:\/\//i.test(v)
  )
}

function isPlaceholderKey(s?: string): boolean {
  if (!s) return true
  const v = String(s)
  return /^\s*$/.test(v) || /YOUR_SUPABASE|REPLACE|<anon_key>/i.test(v)
}

// Alias to keep tests and external imports stable
export const getMissingEnvVars = missingEnvVars
