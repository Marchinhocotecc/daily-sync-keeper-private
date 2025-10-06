import { useCallback, useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'

export interface Profile {
  user_id: string
  username: string | null
  avatar_url: string | null
  language: string | null
  theme: string | null
}

interface UseProfileResult {
  profile: Profile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  upsert: (changes: Partial<Profile>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string | null>
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: userRes } = await (supabase as any).auth.getUser()
      const userId = userRes?.user?.id
      if (!userId) {
        setProfile(null)
        setLoading(false)
        return
      }
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      setProfile(data || {
        user_id: userId,
        username: null,
        avatar_url: null,
        language: null,
        theme: null,
      })
    } catch (e: any) {
      setError(e?.message || 'Profile load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const upsert = useCallback(async (changes: Partial<Profile>) => {
    if (!profile?.user_id) return
    const payload = { user_id: profile.user_id, ...changes }
    const { error } = await (supabase as any)
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
    if (error) throw error
    setProfile(p => ({ ...(p || { user_id: payload.user_id } as Profile), ...payload }))
  }, [profile])

  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile?.user_id) return null
    const ext = file.name.split('.').pop() || 'png'
    const path = `${profile.user_id}/${Date.now()}.${ext}`
    const { error: upErr } = await (supabase as any)
      .storage
      ?.from('avatars')
      .upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data } = (supabase as any)
      .storage
      ?.from('avatars')
      .getPublicUrl(path)
    const url = data?.publicUrl || null
    if (url) {
      await upsert({ avatar_url: url })
    }
    return url
  }, [profile, upsert])

  return { profile, loading, error, refresh: fetchProfile, upsert, uploadAvatar }
}
