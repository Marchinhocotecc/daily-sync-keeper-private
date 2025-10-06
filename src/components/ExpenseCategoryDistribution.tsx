import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { z } from 'zod';

export interface ExpenseCategoryDistributionProps {
  data: Array<{ name: string; value: number }>;
  currencySymbol?: string; // default "€"
}

// Centralized palette so color and legend stay in sync
const PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#a855f7',
];

export const ExpenseCategoryDistribution: React.FC<ExpenseCategoryDistributionProps> = ({
  data,
  currencySymbol = '€',
}) => {
  z.object({
    data: z.array(z.object({ name: z.string(), value: z.number() })),
    currencySymbol: z.string().optional(),
  }).parse({ data, currencySymbol });

  const list = Array.isArray(data) ? data : [];
  // Total sum (displayed in the center of the chart)
  const total = list.reduce((s, d) => s + d.value, 0);
  const itemsWithPct = list
    .map((d, idx) => ({
      ...d,
      color: PALETTE[idx % PALETTE.length],
      pct: total > 0 ? (d.value / total) * 100 : 0,
    }))
    // Sort by descending value so the legend highlights the most relevant first
    .sort((a, b) => b.value - a.value);

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
      {/* Chart area */}
      <div className="relative md:w-1/2 w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={itemsWithPct}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {itemsWithPct.map((item, idx) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(v: any, n: any) => [`${currencySymbol}${Number(v).toFixed(2)}`, n]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-xs text-muted-foreground">Totale</div>
          <div className="text-xl font-bold text-foreground">
            {currencySymbol}{total.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Legend area */}
      <div className="md:w-1/2 w-full">
        <ul className="space-y-2">
          {itemsWithPct.map((item) => (
            <li key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">
                {item.pct.toFixed(0)}%
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
