import React, { useState } from 'react'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { Settings, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  monthlyBudget: number
  totalCurrentMonth: number
  remaining: number
  onUpdate: (v: number) => Promise<any> | void
}

export const BudgetCard: React.FC<Props> = ({ monthlyBudget, totalCurrentMonth, remaining, onUpdate }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'expenses' })
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState<number>(monthlyBudget || 0)

  React.useEffect(() => setVal(monthlyBudget || 0), [monthlyBudget])

  const ratio = monthlyBudget > 0 ? totalCurrentMonth / monthlyBudget : 0
  const pct = Math.min(100, ratio * 100)
  const barColor = ratio < 0.75 ? 'bg-success' : ratio < 1 ? 'bg-yellow-500' : 'bg-destructive'

  return (
    <LifeSyncCard padding="sm" variant="elevated" data-testid="budget-card">
      {!editing && (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-foreground">
              €{monthlyBudget.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">{t('monthlyBudget')}</div>
          </div>
          <LifeSyncButton
            aria-label={t('editMonthlyBudget') || 'Edit'}
            variant="ghost"
            size="icon"
            onClick={() => setEditing(true)}
          >
            <Settings size={16} />
          </LifeSyncButton>
        </div>
      )}

      {editing && (
        <div className="space-y-2">
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-xl border bg-background"
          />
          <div className="flex gap-2">
            <LifeSyncButton
              size="sm"
              variant="primary"
              className="flex-1"
              onClick={async () => {
                await onUpdate(val)
                setEditing(false)
              }}
            >
              <Check size={14} className="mr-1" /> {t('save')}
            </LifeSyncButton>
            <LifeSyncButton size="sm" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
              <X size={14} className="mr-1" /> {t('cancel')}
            </LifeSyncButton>
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>
            {t('spentThisMonth')} €{totalCurrentMonth.toFixed(2)}
          </span>
          <span>
            {remaining >= 0
              ? (t('remaining') || 'Rimanente') + ' €' + remaining.toFixed(2)
              : (t('exceeded') || 'Superato') + ' €' + Math.abs(remaining).toFixed(2)}
          </span>
        </div>
      </div>
    </LifeSyncCard>
  )
}
