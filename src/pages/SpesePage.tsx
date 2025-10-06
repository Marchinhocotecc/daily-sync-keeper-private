import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { EmptyState } from '@/components/EmptyState'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { ExpensesList } from '@/components/expenses/ExpensesList'
import { BudgetCard } from '@/components/expenses/BudgetCard'
import { ExpensesChart } from '@/components/expenses/ExpensesChart'
import { useToast } from '@/hooks/use-toast'
import type { Expense } from '@/lib/supabase'

const SpesePage: React.FC = () => {
  const { t } = useTranslation(undefined, { keyPrefix: 'expenses' })
  const { toast } = useToast()
  const {
    expenses,
    recent,
    scheduled,
    isLoading,
    isError,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    monthlyBudget,
    setMonthlyBudget,
    totalCurrentMonth,
    remainingBudget,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    categoryDistribution,
  } = useExpenses()

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const onAdd = async (payload: Omit<Expense, 'id' | 'user_id'>) => {
    try {
      await addExpense(payload)
      toast({ title: t('save') || 'Salvato', description: t('saved') || 'Spesa aggiunta' })
      setShowAdd(false)
    } catch (e: any) {
      toast({ title: t('loadError') || 'Errore', description: e?.message || 'Errore', variant: 'destructive' as any })
    }
  }
  const onEditSubmit = async (data: Omit<Expense, 'id' | 'user_id'>) => {
    if (!editing) return
    try {
      await updateExpense({ id: editing.id, ...data })
      toast({ title: t('save') || 'Salvato', description: t('updated') || 'Spesa aggiornata' })
      setEditing(null)
    } catch (e: any) {
      toast({ title: 'Errore', description: e?.message || 'Errore', variant: 'destructive' as any })
    }
  }
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDelete') || 'Eliminare questa spesa?')) return
    try {
      await deleteExpense(id)
      toast({ title: t('deleted') || 'Eliminato', description: t('expenseDeleted') || '' })
    } catch (e: any) {
      toast({ title: 'Errore', description: e?.message || 'Errore', variant: 'destructive' as any })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="spese-page">
      <div className="mobile-padding pt-8 pb-4 gradient-surface">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <LifeSyncButton
            variant="primary"
            size="icon"
            className="rounded-full shadow-ocean"
            onClick={() => {
              setEditing(null)
              setShowAdd(s => !s)
            }}
            data-testid="add-expense-toggle"
          >
            <Plus size={20} />
          </LifeSyncButton>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <LifeSyncCard padding="sm" variant="elevated">
            <div className="text-xs text-muted-foreground mb-1">
              {t('spentThisMonth')} €{totalCurrentMonth.toFixed(2)}
            </div>
            <div className="text-2xl font-bold text-foreground">
              €{(totalCurrentMonth / 30).toFixed(2)}
              <span className="text-xs ml-1 opacity-70">/d</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              {remainingBudget >= 0
                ? (t('remaining') || 'Rimanente') + ' €' + remainingBudget.toFixed(2)
                : (t('exceeded') || 'Superato') + ' €' + Math.abs(remainingBudget).toFixed(2)}
            </div>
          </LifeSyncCard>
          <BudgetCard
            monthlyBudget={Number(monthlyBudget || 0)}
            totalCurrentMonth={totalCurrentMonth}
            remaining={remainingBudget}
            onUpdate={async v => {
              try {
                await setMonthlyBudget(v)
                toast({ title: t('save') || 'Salvato', description: t('budgetUpdated') || 'Budget aggiornato' })
              } catch (e: any) {
                toast({ title: 'Errore', description: e?.message || 'Errore', variant: 'destructive' as any })
              }
            }}
          />
        </div>
        {showAdd && !editing && (
          <div className="mt-4">
            <ExpenseForm onCancel={() => setShowAdd(false)} onSubmit={onAdd} />
          </div>
        )}
        {editing && (
          <div className="mt-4">
            <ExpenseForm
              initial={editing}
              onCancel={() => setEditing(null)}
              onSubmit={onEditSubmit}
            />
          </div>
        )}
      </div>

      {isError && (
        <div className="mobile-padding">
          <LifeSyncCard>
            <div className="flex items-center justify-between">
              <div className="text-sm text-destructive">{t('loadError') || 'Errore'}</div>
            </div>
          </LifeSyncCard>
        </div>
      )}

      <div className="mobile-padding space-y-6">
        {isLoading && (
          <LifeSyncCard className="animate-pulse">
            <div className="h-14 bg-muted rounded-xl mb-2" />
            <div className="h-14 bg-muted rounded-xl" />
          </LifeSyncCard>
        )}

        {!isLoading && expenses.length === 0 && !showAdd && !editing && (
          <LifeSyncCard className="animate-fade-in">
            <EmptyState
              icon="💸"
              title={t('noExpensesTitle') || 'Nessuna spesa'}
              description={t('noExpensesDesc') || 'Aggiungi la tua prima spesa.'}
              actionLabel={t('addExpense') || 'Aggiungi'}
              onAction={() => setShowAdd(true)}
            />
          </LifeSyncCard>
        )}

        {!isLoading && expenses.length > 0 && (
          <>
            <ExpensesChart
              daily={dailyTrend}
              weekly={weeklyTrend}
              monthly={monthlyTrend}
              categories={categoryDistribution}
              total={totalCurrentMonth}
            />
            <ExpensesList
              recent={recent}
              scheduled={scheduled}
              onEdit={e => {
                setShowAdd(false)
                setEditing(e)
              }}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      {/* Lightweight inline edit modal alternative removed; integrated form above. */}
    </div>
  )
}

export default SpesePage