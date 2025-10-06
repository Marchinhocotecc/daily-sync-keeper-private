import React from 'react'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Expense } from '@/lib/supabase'

const categories = [
  { name: 'Food', icon: '🍽️' },
  { name: 'Transport', icon: '🚌' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Health', icon: '💊' },
  { name: 'Other', icon: '💳' },
]

export interface ExpenseDraft {
  amount: string
  category: string
  description: string
  icon: string
  date: string
}

interface Props {
  initial?: Expense | null
  onCancel: () => void
  onSubmit: (payload: Omit<Expense, 'id' | 'user_id'>) => Promise<any> | void
}

export const ExpenseForm: React.FC<Props> = ({ initial, onCancel, onSubmit }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'expenses' })
  const [draft, setDraft] = React.useState<ExpenseDraft>(() =>
    initial
      ? {
        amount: String(initial.amount),
        category: initial.category,
        description: initial.description,
        icon: initial.icon,
        date: initial.date,
      }
      : {
        amount: '',
        category: 'Food',
        description: '',
        icon: '🍽️',
        date: new Date().toISOString().split('T')[0],
      }
  )

  const submit = async () => {
    const amt = parseFloat(draft.amount)
    if (!draft.amount || isNaN(amt) || amt <= 0) return
    if (!draft.date) return
    await onSubmit({
      amount: amt,
      category: draft.category,
      description: draft.description.trim(),
      icon: draft.icon,
      date: draft.date,
    })
    if (!initial) {
      setDraft({
        amount: '',
        category: 'Food',
        description: '',
        icon: '🍽️',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }

  return (
    <LifeSyncCard data-testid={initial ? 'edit-expense-form' : 'add-expense-form'}>
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          {initial ? t('editExpense') || 'Modifica' : t('newExpense') || 'Nuova spesa'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            step="0.01"
            value={draft.amount}
            onChange={e => setDraft(p => ({ ...p, amount: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border bg-background"
            placeholder={t('amountPlaceholder') || ''}
          />
          <select
            value={draft.category}
            onChange={e => {
              const cat = categories.find(c => c.name === e.target.value)
              setDraft(p => ({ ...p, category: e.target.value, icon: cat?.icon || '💳' }))
            }}
            className="w-full px-3 py-2 rounded-xl border bg-background"
          >
            {categories.map(c => (
              <option key={c.name} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="date"
          value={draft.date}
          onChange={e => setDraft(p => ({ ...p, date: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border bg-background"
        />
        <input
          type="text"
          value={draft.description}
            onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border bg-background"
          placeholder={t('descriptionPlaceholder') || ''}
        />
        <div className="flex space-x-2">
          <LifeSyncButton
            variant="primary"
            onClick={submit}
            className="flex-1"
            data-testid="submit-expense"
            disabled={!draft.amount || !draft.description.trim()}
          >
            <Check size={16} className="mr-2" />
            {t('save')}
          </LifeSyncButton>
          <LifeSyncButton variant="outline" onClick={onCancel} className="flex-1">
            <X size={16} className="mr-2" />
            {t('cancel')}
          </LifeSyncButton>
        </div>
      </div>
    </LifeSyncCard>
  )
}
