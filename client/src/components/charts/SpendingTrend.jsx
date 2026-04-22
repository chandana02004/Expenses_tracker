import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/utils/currency'

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  )
}

export default function SpendingTrend({ data, currency }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(263,70%,65%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(263,70%,65%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,6%,14%)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(240,5%,55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(240,5%,55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="hsl(263,70%,65%)"
          strokeWidth={2}
          fill="url(#spendGrad)"
          dot={{ fill: 'hsl(263,70%,65%)', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'hsl(263,70%,65%)', stroke: 'hsl(240,10%,3.9%)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
