import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/utils/currency'

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{d.icon} {d.name}</p>
      <p className="text-sm font-semibold text-foreground">{formatCurrency(d.spent, currency)}</p>
    </div>
  )
}

export default function CategoryPie({ data, currency }) {
  const total = data.reduce((s, d) => s + d.spent, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="spent"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="space-y-2 mt-2 overflow-y-auto max-h-36">
        {data.slice(0, 5).map((d) => (
          <div key={d.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground truncate max-w-[100px]">{d.name}</span>
            </div>
            <span className="text-foreground font-medium">
              {total > 0 ? Math.round((d.spent / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
