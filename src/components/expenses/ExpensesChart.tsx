import React from 'react'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'

interface TrendPoint {
  label: string
  key: string
  amount: number
}
interface CategoryPoint {
  category: string
  total: number
}

interface Props {
  daily: TrendPoint[]
  weekly: TrendPoint[]
  monthly: TrendPoint[]
  categories: CategoryPoint[]
  total: number
}

export const ExpensesChart: React.FC<Props> = ({ daily, weekly, monthly, categories, total }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'expenses' })
  const [range, setRange] = React.useState<'day' | 'week' | 'month'>('day')

  const data = range === 'day' ? daily : range === 'week' ? weekly : monthly

  const totalCat = categories.reduce((s, c) => s + c.total, 0)

  return (
    <LifeSyncCard data-testid="expenses-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {range === 'day'
            ? t('trendTitleDay')
            : range === 'week'
              ? t('trendTitleWeek')
              : t('trendTitleMonth')}
        </h3>
        <div className="inline-flex bg-muted rounded-lg p-1">
          <button
            className={`px-2 py-1 text-xs rounded-md ${range === 'day' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setRange('day')}
          >
            {t('daily')}
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md ${range === 'week' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setRange('week')}
          >
            {t('weekly')}
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md ${range === 'month' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setRange('month')}
          >
            {t('monthly')}
          </button>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={8}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ opacity: 0.15 }}
              formatter={(v: any) => ['€' + Number(v).toFixed(2), t('amount') || 'Importo']}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border bg-background/40 text-sm">
          <div className="font-semibold">{t('spentThisMonth')}</div>
          <div className="text-primary font-bold text-lg">€{total.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl border bg-background/40 text-sm">
          <div className="font-semibold">{t('categoryDistribution')}</div>
          <div className="mt-1 max-h-20 overflow-y-auto pr-1 space-y-1 text-[11px]" data-testid="category-dist">
            {categories.slice(0, 6).map(c => {
              const pct = totalCat > 0 ? (c.total / totalCat) * 100 : 0
              return (
                <div key={c.category} className="flex justify-between">
                  <span className="truncate">{c.category}</span>
                  <span className="font-medium">
                    {pct.toFixed(0)}% (€{c.total.toFixed(2)})
                  </span>
                </div>
              )
            })}
            {categories.length === 0 && <span>{t('noData') || 'Nessun dato'}</span>}
          </div>
        </div>
      </div>
    </LifeSyncCard>
  )
}
