import React, { useState, useRef, useEffect } from 'react'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { useTranslation } from 'react-i18next'
import type { TaskPriority } from '@/types/task'

interface Props {
  onSubmit: (title: string, priority: TaskPriority) => void
  onCancel: () => void
  loading?: boolean
}

const priorities: TaskPriority[] = ['high', 'medium', 'low']

export const TaskForm: React.FC<Props> = ({ onSubmit, onCancel, loading }) => {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || loading) return
    onSubmit(title.trim(), priority)
  }

  return (
    <form
      onSubmit={handle}
      className="space-y-3"
      aria-label={t('home.tasks.form.titleLabel')}
    >
      <div className="space-y-1">
        <label htmlFor="task-title" className="text-xs font-medium text-foreground">
          {t('home.tasks.form.titleLabel')}
        </label>
        <input
          ref={inputRef}
          id="task-title"
          aria-required="true"
          value={title}
          disabled={loading}
            onChange={e => setTitle(e.target.value)}
          placeholder={t('home.tasks.form.titlePlaceholder') || ''}
          className="w-full px-3 py-2 rounded-xl border bg-background text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="task-priority" className="text-xs font-medium text-foreground">
          {t('home.tasks.form.priorityLabel')}
        </label>
        <select
          id="task-priority"
          aria-label={t('home.tasks.form.priorityLabel')}
          value={priority}
          disabled={loading}
          onChange={e => setPriority(e.target.value as TaskPriority)}
          className="w-full px-3 py-2 rounded-xl border bg-background text-sm"
        >
          {priorities.map(p => (
            <option key={p} value={p}>{t(`priority.${p}`)}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <LifeSyncButton
          type="submit"
          variant="primary"
          disabled={loading || !title.trim()}
          aria-label={t('home.tasks.form.submit')}
          className="flex-1"
        >
          {loading ? t('common.loading') : t('home.tasks.form.submit')}
        </LifeSyncButton>
        <LifeSyncButton
          type="button"
          variant="outline"
          onClick={onCancel}
          aria-label={t('home.tasks.form.cancel')}
          className="flex-1"
        >
          {t('home.tasks.form.cancel')}
        </LifeSyncButton>
      </div>
    </form>
  )
}
