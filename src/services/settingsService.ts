import supabase from '@/lib/supabaseClient'
import { getCurrentUserId } from './authService'

export type UserSettings = {
  user_id: string
  theme: string | null
  language: string | null
  notifications_enabled: boolean | null
}

const DEFAULT: UserSettings = {
  user_id: '',
  theme: 'system',
  language: 'en',
  notifications_enabled: true,
}

export async function loadUserSettings(): Promise<UserSettings | null> {
  const uid = await getCurrentUserId()
  if (!uid) return null
  const { data, error } = await supabase
    .from('settings')
    .select('user_id, theme, language, notifications_enabled, updated_at')
    .eq('user_id', uid)
    .maybeSingle()
  if (error) return { ...DEFAULT, user_id: uid }
  if (!data) return { ...DEFAULT, user_id: uid }
  return {
    user_id: data.user_id,
    theme: data.theme ?? DEFAULT.theme,
    language: data.language ?? DEFAULT.language,
    notifications_enabled: data.notifications_enabled ?? DEFAULT.notifications_enabled,
  }
}

export async function upsertUserSettings(patch: Partial<Omit<UserSettings, 'user_id'>>): Promise<UserSettings> {
  const uid = await getCurrentUserId()
  if (!uid) throw new Error('not_authenticated')
  const current = await loadUserSettings() || { ...DEFAULT, user_id: uid }
  const payload = {
    user_id: uid,
    theme: patch.theme ?? current.theme,
    language: patch.language ?? current.language,
    notifications_enabled: typeof patch.notifications_enabled === 'boolean'
      ? patch.notifications_enabled
      : current.notifications_enabled,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
  return payload
}

export async function updateUserTheme(theme: string) {
  return upsertUserSettings({ theme })
}
export async function updateUserNotifications(enabled: boolean) {
  return upsertUserSettings({ notifications_enabled: enabled })
}
