import React from 'react'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { EmptyState } from '@/components/EmptyState'
import { Pencil, Trash2, Receipt } from 'lucide-react'
import type { Expense } from '@/lib/supabase'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { useTranslation } from 'react-i18next'

interface Props {
  recent: Expense[]
  scheduled: Expense[]
  onEdit: (e: Expense) => void
  onDelete: (id: string) => void
}

export const ExpensesList: React.FC<Props> = ({ recent, scheduled, onEdit, onDelete }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'expenses' })
  const [expanded, setExpanded] = React.useState(false)

  return (
    <>
      {scheduled.length > 0 && (
        <LifeSyncCard data-testid="scheduled-expenses">
          <div className="flex items-center space-x-2 mb-4">
            <Receipt className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-foreground">
              {t('scheduledExpenses') || 'Spese programmate'}
            </h3>
          </div>
          <div className="space-y-2">
            {scheduled.map(expense => {
              const safeDate = new Date(expense.date).toLocaleDateString('it-IT')
              return (
                <div
                  key={expense.id}
                  className="p-3 rounded-xl border bg-background/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{expense.icon || '💳'}</div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{expense.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {expense.category} • {safeDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">€{Number(expense.amount).toFixed(2)}</div>
                    <button
                      className="px-2 py-1 text-xs rounded-lg border hover:bg-accent"
                      onClick={() => onEdit(expense)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="px-2 py-1 text-xs rounded-lg border hover:bg-accent text-destructive"
                      onClick={() => onDelete(expense.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </LifeSyncCard>
      )}

      <LifeSyncCard data-testid="recent-expenses">
        <div className="flex items-center space-x-2 mb-4">
          <Receipt className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-foreground">{t('recentExpenses')}</h3>
        </div>
        {recent.length === 0 && (
          <div className="py-6">
            <EmptyState
              icon="🗂️"
              title={t('noExpensesTitle') || 'Nessuna spesa'}
              description={t('adjustFilters') || 'Nessuna spesa trovata.'}
              compact
            />
          </div>
        )}
        {recent.length > 0 && (
          <div className="space-y-2">
            {(expanded ? [...recent].reverse() : [...recent].slice(-5).reverse()).map(expense => {
              const safeDate = new Date(expense.date).toLocaleDateString('it-IT')
              return (
                <div
                  key={expense.id}
                  className="p-3 rounded-xl border bg-background/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{expense.icon || '💳'}</div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{expense.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {expense.category} • {safeDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">€{Number(expense.amount).toFixed(2)}</div>
                    <button
                      className="px-2 py-1 text-xs rounded-lg border hover:bg-accent"
                      onClick={() => onEdit(expense)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="px-2 py-1 text-xs rounded-lg border hover:bg-accent text-destructive"
                      onClick={() => onDelete(expense.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {recent.length > 5 && (
          <div className="mt-4 pt-3 border-t border-border text-center">
            <LifeSyncButton
              variant="ghost"
              className="text-primary"
              onClick={() => setExpanded(e => !e)}
              data-testid="toggle-expenses"
            >
              {expanded ? t('showLess') || 'Mostra meno' : t('viewAll', { count: recent.length }) || `Vedi tutte (${recent.length})`}
            </LifeSyncButton>
          </div>
        )}
      </LifeSyncCard>
    </>
  )
}
