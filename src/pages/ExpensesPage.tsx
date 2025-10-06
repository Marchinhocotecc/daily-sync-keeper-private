import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet, Filter, Trash2, Loader2, BarChart3, PieChart as PieIcon } from 'lucide-react'
import { ExpenseCategoryDistribution } from '@/components/ExpenseCategoryDistribution'
import { useMonthlyBudget } from '@/services/budgetService'
import { fetchExpenses, addExpense, deleteExpense, type ExpenseRecord, expenseKeys } from '@/services/expensesService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

// Types ----------------------------------------------------------------
type PeriodFilter = 'today' | 'week' | 'month' | 'custom'

// Helpers --------------------------------------------------------------
const todayISO = () => new Date().toISOString().split('T')[0]
const startOfWeekISO = () => {
  const d = new Date()
  const day = d.getDay() || 7
  if (day > 1) d.setDate(d.getDate() - (day - 1))
  return d.toISOString().split('T')[0]
}
const startOfMonthISO = () => {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

function withinRange(date: string, from: string, to: string) {
  return date >= from && date <= to
}

function monthOf(date: string) {
  return date.slice(0, 7) // YYYY-MM
}

function getCurrentMonthISO() {
  return new Date().toISOString().slice(0, 7)
}

// Page -----------------------------------------------------------------
const ExpensesPage: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()

  // Filters state
  const [period, setPeriod] = React.useState<PeriodFilter>('month')
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState<string>('all')
  const [customFrom, setCustomFrom] = React.useState(startOfMonthISO())
  const [customTo, setCustomTo] = React.useState(todayISO())

  // Add dialog
  const [openAdd, setOpenAdd] = React.useState(false)
  const [form, setForm] = React.useState({ description: '', amount: '', category: '', date: todayISO() })

  // Data fetching
  const { data: expenses = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: expenseKeys.list(),
    queryFn: fetchExpenses,
    staleTime: 1000 * 60,
  })

  // Budget (current month)
  const { amount: monthlyBudget, loading: budgetLoading, error: budgetError, save: saveBudget } = useMonthlyBudget()

  // Mutations
  const addMut = useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.list() })
      setOpenAdd(false)
      setForm({ description: '', amount: '', category: '', date: todayISO() })
    },
  })

  const delMut = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.list() }),
  })

  // Derived categories (unique)
  const categories = React.useMemo(
    () => Array.from(new Set(expenses.map(e => e.category).filter(Boolean))).sort(),
    [expenses]
  )

  // Date boundaries for period filter
  const { fromDate, toDate } = React.useMemo(() => {
    if (period === 'today') return { fromDate: todayISO(), toDate: todayISO() }
    if (period === 'week') return { fromDate: startOfWeekISO(), toDate: todayISO() }
    if (period === 'month') return { fromDate: startOfMonthISO(), toDate: todayISO() }
    return { fromDate: customFrom, toDate: customTo }
  }, [period, customFrom, customTo])

  // Filtered list
  const filtered = React.useMemo(() => {
    return expenses
      .filter(e => withinRange(e.date, fromDate, toDate))
      .filter(e => (category === 'all' ? true : e.category === category))
      .filter(e =>
        search.trim()
          ? (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.category || '').toLowerCase().includes(search.toLowerCase())
          : true
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, fromDate, toDate, category, search])

  // Current month spent (for progress)
  const currentMonth = getCurrentMonthISO()
  const monthSpent = React.useMemo(
    () =>
      expenses
        .filter(e => monthOf(e.date) === currentMonth)
        .reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses]
  )

  // Category distribution (for all filtered set)
  const pieData = React.useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach(e => {
      const key = e.category || t('expenses.uncategorized', 'Senza categoria')
      map.set(key, (map.get(key) || 0) + Number(e.amount || 0))
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [filtered, t])

  // Time series (bar) using filtered range
  const barData = React.useMemo(() => {
    const byDate = new Map<string, number>()
    filtered.forEach(e => {
      byDate.set(e.date, (byDate.get(e.date) || 0) + Number(e.amount || 0))
    })
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date: date.slice(5), total }))
  }, [filtered])

  // UI Subcomponents ---------------------------------------------------
  const ExpenseFilters: React.FC = () => (
    <Card className="border bg-background">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Filter className="w-4 h-4" />
          {t('expenses.filters', 'Filtri')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-5 gap-3">
        <Select value={period} onValueChange={v => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('expenses.period', 'Periodo')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t('period.today', 'Oggi')}</SelectItem>
            <SelectItem value="week">{t('period.week', 'Settimana')}</SelectItem>
            <SelectItem value="month">{t('period.month', 'Mese')}</SelectItem>
            <SelectItem value="custom">{t('period.custom', 'Personalizzato')}</SelectItem>
          </SelectContent>
        </Select>
        {period === 'custom' && (
          <>
            <Input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-9"
            />
            <Input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={e => setCustomTo(e.target.value)}
              className="h-9"
            />
          </>
        )}
        <Input
          placeholder={t('common.search', 'Cerca...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('expenses.category', 'Categoria')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all', 'Tutte')}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )

  const BudgetCard: React.FC = () => {
    const pct = monthlyBudget > 0 ? Math.min(100, (monthSpent / monthlyBudget) * 100) : 0
    return (
      <Card className="border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="w-4 h-4" />
            {t('budget.monthlyBudget', 'Budget mensile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {budgetLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('common.loading', 'Caricamento...')}
            </div>
          )}
            {budgetError && (
              <div className="text-xs text-destructive">{budgetError}</div>
            )}
          <div className="text-sm">
            {monthlyBudget > 0
              ? t('budget.setTo', 'Impostato a') + ' ' + monthlyBudget.toFixed(2)
              : t('budget.notSet', 'Nessun budget impostato')}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('budget.spent', 'Speso')}: {monthSpent.toFixed(2)} • {t('budget.remaining', 'Rimanente')}:{' '}
            <span className={monthSpent > monthlyBudget && monthlyBudget > 0 ? 'text-destructive' : ''}>
              {(monthlyBudget - monthSpent).toFixed(2)}
            </span>
          </div>
          <Progress value={pct} className="h-2" />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder={t('budget.newAmount', 'Nuovo importo')}
              className="h-8 text-xs"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = Number((e.target as HTMLInputElement).value)
                  if (!isNaN(v) && v >= 0) saveBudget(v)
                }
              }}
              onBlur={e => {
                const v = Number(e.target.value)
                if (!isNaN(v) && v >= 0) saveBudget(v)
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const inp = (document.activeElement as HTMLInputElement)
                if (inp?.value) {
                  const v = Number(inp.value)
                  if (!isNaN(v) && v >= 0) saveBudget(v)
                }
              }}
            >
              {t('common.save', 'Salva')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ExpenseList: React.FC = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )
    }
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="text-sm text-destructive">
            {t('errors.loadFailed', 'Errore nel caricamento')}:{' '}
            {(error as any)?.message || 'Unknown'}
          </div>
          <Button size="sm" onClick={() => refetch()}>
            {t('common.retry', 'Riprova')}
          </Button>
        </div>
      )
    }
    if (filtered.length === 0) {
      return (
        <div className="py-6 text-center text-xs text-muted-foreground">
          {t('expenses.empty', 'Nessuna spesa trovata')}
        </div>
      )
    }
    return (
      <ul className="divide-y border rounded-md bg-background">
        {filtered.map(e => (
          <li
            key={e.id}
            className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 transition-colors text-sm"
          >
            <div className="w-20 shrink-0 tabular-nums text-xs text-muted-foreground">{e.date}</div>
            <div className="flex-1 truncate">{e.description || '-'}</div>
            <div className="w-28 text-xs text-muted-foreground truncate">{e.category || '-'}</div>
            <div className="w-24 text-right font-medium tabular-nums">
              {Number(e.amount).toFixed(2)}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => !delMut.isLoading && delMut.mutate(e.id)}
              aria-label={t('common.delete', 'Elimina')}
            >
              {delMut.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </li>
        ))}
      </ul>
    )
  }

  const ExpensesCharts: React.FC = () => (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <PieIcon className="w-4 h-4" />
            {t('expenses.byCategory', 'Per categoria')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseCategoryDistribution
            data={pieData}
            currencySymbol="€"
          />
        </CardContent>
      </Card>
      <Card className="border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="w-4 h-4" />
            {t('expenses.trend', 'Andamento')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                formatter={(v: any) => [`€${Number(v).toFixed(2)}`, t('expenses.amount', 'Importo')]}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )

  const AddExpenseDialog: React.FC = () => {
    const disabled =
      !form.description.trim() ||
      !form.amount ||
      Number(form.amount) <= 0 ||
      !form.category ||
      !form.date
    return (
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('expenses.addExpense', 'Aggiungi Spesa')}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('expenses.new', 'Nuova Spesa')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <label className="text-xs font-medium">{t('common.title', 'Titolo')}</label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t('expenses.titlePlaceholder', 'Descrizione')}
                autoFocus
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">{t('expenses.amount', 'Importo')}</label>
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">{t('expenses.category', 'Categoria')}</label>
              <Select
                value={form.category}
                onValueChange={v => setForm(f => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('expenses.category', 'Categoria')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <SelectItem value="General">General</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">{t('common.date', 'Data')}</label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                max={todayISO()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (disabled) return
                addMut.mutate({
                  description: form.description.trim(),
                  amount: Number(form.amount),
                  category: form.category || 'General',
                  date: form.date,
                })
              }}
              disabled={disabled || addMut.isLoading}
              className="gap-2"
            >
              {addMut.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save', 'Salva')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Render -------------------------------------------------------------
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="w-5 h-5" />
            </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('expenses.title', 'Spese')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <AddExpenseDialog />
        </div>
      </header>

      <ExpenseFilters />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BudgetCard />
          <Card className="border bg-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('expenses.register', 'Registro Spese')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseList />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <ExpensesCharts />
        </div>
      </div>
    </div>
  )
}

export default ExpensesPage
