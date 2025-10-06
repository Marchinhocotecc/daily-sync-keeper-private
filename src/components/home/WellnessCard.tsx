import React from 'react'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { useWellness } from '@/hooks/useWellness'
import { useTranslation } from 'react-i18next'

export const WellnessCard: React.FC = () => {
  const { t } = useTranslation()
  const { wellnessData, loading } = useWellness()
  const stepsPct = Math.min(100, (wellnessData.steps / Math.max(1, wellnessData.step_goal)) * 100)
  const calPct = Math.min(100, (wellnessData.calories / Math.max(1, wellnessData.calorie_goal)) * 100)

  const barCls = (v: number) =>
    v < 33 ? 'bg-destructive' : v < 66 ? 'bg-warning' : 'bg-success'

  return (
    <LifeSyncCard className="space-y-4" aria-labelledby="home-wellness-title">
      <h2 id="home-wellness-title" className="text-lg font-semibold text-foreground">
        {t('home.wellness.title')}
      </h2>
      {loading && (
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-muted animate-pulse" />
          <div className="h-14 rounded-xl bg-muted animate-pulse" />
        </div>
      )}
      {!loading && (
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>{t('home.wellness.steps')}</span>
              <span>{wellnessData.steps.toLocaleString()} / {wellnessData.step_goal.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${barCls(stepsPct)}`}
                style={{ width: `${stepsPct}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>{t('home.wellness.calories')}</span>
              <span>{wellnessData.calories} / {wellnessData.calorie_goal}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${barCls(calPct)}`}
                style={{ width: `${calPct}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 text-center">
            <div>
              <div className="text-xl font-bold">{Math.round(stepsPct)}%</div>
              <div className="text-[10px] text-muted-foreground">{t('home.wellness.steps')}</div>
            </div>
            <div>
              <div className="text-xl font-bold">{Math.round(calPct)}%</div>
              <div className="text-[10px] text-muted-foreground">{t('home.wellness.calories')}</div>
            </div>
          </div>
        </div>
      )}
    </LifeSyncCard>
  )
}
