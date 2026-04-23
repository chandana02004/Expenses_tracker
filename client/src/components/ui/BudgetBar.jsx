import { motion } from 'framer-motion'
import { formatCurrency } from '@/utils/currency'

function barColor(pct) {
  if (pct >= 100) return '#ef4444'
  if (pct >= 80) return '#f97316'
  if (pct >= 60) return '#eab308'
  return '#22c55e'
}

export default function BudgetBar({ name, icon, spent, budgetLimit, color, currency = 'USD', delay = 0 }) {
  const pct = budgetLimit ? Math.min((spent / budgetLimit) * 100, 100) : 0
  const bc = barColor(pct)

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-foreground font-medium text-sm">{name}</span>
        </div>
        <div className="text-right">
          <span className="text-foreground font-semibold text-sm">{formatCurrency(spent, currency)}</span>
          {budgetLimit && (
            <span className="text-muted-foreground text-xs"> / {formatCurrency(budgetLimit, currency)}</span>
          )}
        </div>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: bc }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: delay + 0.1, ease: 'easeOut' }}
        />
      </div>
      {budgetLimit && (
        <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% used</p>
      )}
    </motion.div>
  )
}
