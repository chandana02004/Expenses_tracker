import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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

export default function MonthlyBar({ data, currency, currentMonth }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,6%,14%)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'hsl(240,5%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'hsl(240,5%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.month === currentMonth ? 'hsl(263,70%,65%)' : 'hsl(240,5%,20%)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
