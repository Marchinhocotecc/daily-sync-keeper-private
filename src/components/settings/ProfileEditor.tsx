import React, { useState } from 'react'
import i18n from '@/i18n'
import { useProfile } from '@/hooks/useProfile'
import supabase from '@/lib/supabaseClient'

export const ProfileEditor: React.FC = () => {
  const { profile, upsert, uploadAvatar } = useProfile()
  const [username, setUsername] = useState(profile?.username || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  React.useEffect(() => {
    setUsername(profile?.username || '')
  }, [profile?.username])

  const email = (supabase as any)?._cachedEmail || profile?.email // fallback (not stored) - email read-only best-effort

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await upsert({ username: username.trim() || null })
      setMessage(i18n.t('settings.profile.updated'))
    } catch (e: any) {
      setMessage(e?.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setAvatarUploading(true)
    setMessage(null)
    try {
      await uploadAvatar(e.target.files[0])
      setMessage(i18n.t('settings.profile.updated'))
    } catch (er: any) {
      setMessage(er?.message || 'Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">{i18n.t('settings.profile.section')}</h3>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center dark:bg-gray-700">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            : <span className="text-xs text-gray-500">no avatar</span>}
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            disabled={avatarUploading}
            onChange={onAvatar}
            className="text-xs"
          />
          {avatarUploading && <div className="text-xs text-gray-500 mt-1">Uploading…</div>}
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium">
          {i18n.t('settings.profile.username')}
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="mt-1 w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
            placeholder={i18n.t('settings.profile.username')}
          />
        </label>
        <label className="block text-xs font-medium opacity-70">
          {i18n.t('settings.profile.email')}
          <input
            value={email || '—'}
            disabled
            className="mt-1 w-full border rounded px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
        </label>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded bg-green-600 text-white text-sm disabled:opacity-60"
      >
        {saving ? i18n.t('settings.profile.updating') : i18n.t('settings.profile.save')}
      </button>
      {message && <div className="text-xs text-gray-600 dark:text-gray-300">{message}</div>}
    </div>
  )
}
