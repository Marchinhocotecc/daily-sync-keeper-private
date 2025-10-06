import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { DailyActivitiesCard } from '@/components/home/DailyActivitiesCard'
import { TaskForm } from '@/components/home/TaskForm'
import { TaskList } from '@/components/home/TaskList'
import { WellnessCard } from '@/components/home/WellnessCard'
import { useTasks } from '@/hooks/useTasks'
import type { TaskPriority } from '@/types/task'
import { Plus } from 'lucide-react'

const HomePage: React.FC = () => {
  const { t } = useTranslation()
  const { tasks, isLoading, isError, addTask, updateTask, deleteTask, adding } = useTasks()
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (title: string, priority: TaskPriority) => {
    addTask(title, priority)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mobile-padding pt-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('home.title', 'home.title')}
        </h1>

        <DailyActivitiesCard />

        <LifeSyncCard className="space-y-4" aria-labelledby="tasks-title">
          <div className="flex items-center justify-between">
            <h2 id="tasks-title" className="text-lg font-semibold text-foreground">
              {t('home.tasks.title')}
            </h2>
            <LifeSyncButton
              variant={showForm ? 'outline' : 'primary'}
              size="sm"
              aria-label={t('home.tasks.addButton')}
              data-testid="add-task-button"
              onClick={() => setShowForm(s => !s)}
            >
              <Plus size={14} className="mr-1" />
              {t('home.tasks.addButton')}
            </LifeSyncButton>
          </div>

            {showForm && (
              <TaskForm
                loading={adding}
                onSubmit={handleAdd}
                onCancel={() => setShowForm(false)}
              />
            )}

          {isLoading && (
            <div className="space-y-2">
              <div className="h-12 rounded-xl bg-muted animate-pulse" />
              <div className="h-12 rounded-xl bg-muted animate-pulse" />
            </div>
          )}

          {isError && (
            <div className="text-sm text-destructive">
              {t('home.tasks.errorGeneric')}
            </div>
          )}

          {!isLoading && !isError && (
            <TaskList
              tasks={safeTasks}
              onChangePriority={updateTask}
              onDelete={deleteTask}
            />
          )}
        </LifeSyncCard>

        <WellnessCard />
      </div>
    </div>
  )
}

export default HomePage