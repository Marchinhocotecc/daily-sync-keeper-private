import React from 'react'
import type { Task, TaskPriority } from '@/types/task'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  tasks: Task[]
  onChangePriority: (id: string, pr: TaskPriority) => void
  onDelete: (id: string) => void
  deletingIds?: string[]
}

const priorities: TaskPriority[] = ['high', 'medium', 'low']

export const TaskList: React.FC<Props> = ({
  tasks,
  onChangePriority,
  onDelete,
  deletingIds = [],
}) => {
  const { t } = useTranslation()
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="tasks-empty">
        {t('home.tasks.empty')}
      </p>
    )
  }
  return (
    <ul className="space-y-2" aria-live="polite">
      {tasks.map(task => (
        <li
          key={task.id}
          className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-background/50 text-sm"
        >
          <span className="flex-1 break-words">{task.title}</span>
          <select
            aria-label={t('home.tasks.form.priorityLabel')}
            value={task.priority}
            onChange={e => onChangePriority(task.id, e.target.value as TaskPriority)}
            className="px-2 py-1 rounded-lg border bg-background text-xs"
          >
            {priorities.map(p => (
              <option key={p} value={p}>{t(`priority.${p}`)}</option>
            ))}
          </select>
          <LifeSyncButton
            variant="ghost"
            size="icon"
            aria-label={t('common.delete')}
            onClick={() => {
              if (window.confirm(t('home.tasks.deleteConfirm') || '')) {
                onDelete(task.id)
              }
            }}
            disabled={deletingIds.includes(task.id)}
          >
            <Trash2 size={16} />
          </LifeSyncButton>
        </li>
      ))}
    </ul>
  )
}
