import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, TrendingDown, TrendingUp, PiggyBank, Target,
  AlertTriangle, Bell, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { getDashboard } from '@/api/dashboard'
import useStore from '@/store/useStore'
import { formatCurrency, CURRENCIES } from '@/utils/currency'
import { getCurrentMonth, getMonthLabel } from '@/utils/date'
import StatCard from '@/components/ui/StatCard'
import BudgetBar from '@/components/ui/BudgetBar'
import SpendingTrend from '@/components/charts/SpendingTrend'
import CategoryPie from '@/components/charts/CategoryPie'
import MonthlyBar from '@/components/charts/MonthlyBar'

function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Dashboard() {
  const { user } = useStore()
  const currency = user?.currency || 'USD'
  const [month, setMonth] = useState(getCurrentMonth())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState([])
  const [activeChart, setActiveChart] = useState('trend')

  useEffect(() => {
    setLoading(true)
    getDashboard({ month })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [month])

  const fmt = (n) => formatCurrency(n, currency)
  const isCurrentMonth = month === getCurrentMonth()

  const skeletonClass = 'bg-secondary/40 rounded animate-pulse'

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold text-foreground"
          >
            {isCurrentMonth
              ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] ?? ''} 👋`
              : getMonthLabel(month)}
          </motion.h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's your financial overview for {getMonthLabel(month)}.
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-foreground w-24 text-center">
            {getMonthLabel(month)}
          </span>
          <button
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            disabled={isCurrentMonth}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      <AnimatePresence>
        {data?.alerts?.filter((a) => !dismissedAlerts.includes(a.message)).map((alert) => (
          <motion.div
            key={alert.message}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
              alert.type === 'exceeded'
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : 'border-orange-500/30 bg-orange-500/10 text-orange-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{alert.message}</span>
            </div>
            <button
              onClick={() => setDismissedAlerts((p) => [...p, alert.message])}
              className="ml-4 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${skeletonClass} h-32`} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Spent"
              value={fmt(data?.totalExpenses ?? 0)}
              trend={data?.expenseChange}
              trendLabel="vs last month"
              icon={Wallet}
              accent="hsl(263,70%,65%)"
              delay={0}
            />
            <StatCard
              label="Budget Used"
              value={fmt(data?.budgetUsed ?? 0)}
              sub={data?.budgetTotal > 0 ? `of ${fmt(data.budgetTotal)} total` : 'No budgets set'}
              icon={Target}
              accent="#f97316"
              delay={0.07}
            />
            <StatCard
              label="Budget Left"
              value={fmt(Math.max(0, (data?.budgetTotal ?? 0) - (data?.budgetUsed ?? 0)))}
              sub={data?.budgetTotal > 0 ? `${Math.max(0, 100 - Math.round(((data?.budgetUsed ?? 0) / data.budgetTotal) * 100))}% remaining` : ''}
              icon={PiggyBank}
              accent="#22c55e"
              delay={0.14}
            />
            <StatCard
              label="Categories"
              value={data?.byCategory?.length ?? 0}
              sub="with spending this month"
              icon={TrendingDown}
              accent="#06b6d4"
              delay={0.21}
            />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main chart (2/3) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Spending Overview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">7-month expense trend</p>
            </div>
            <div className="flex gap-1 bg-secondary/50 border border-border rounded-lg p-1">
              {['trend', 'bar'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveChart(t)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeChart === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'trend' ? 'Area' : 'Bar'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            {loading ? (
              <div className={`${skeletonClass} h-full`} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChart}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeChart === 'trend' ? (
                    <SpendingTrend data={data?.monthlyTrend ?? []} currency={currency} />
                  ) : (
                    <MonthlyBar data={data?.monthlyTrend ?? []} currency={currency} currentMonth={month} />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Pie chart (1/3) */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">By Category</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown this month</p>
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: 220 }}>
            {loading ? (
              <div className={`${skeletonClass} h-full`} />
            ) : data?.byCategory?.length > 0 ? (
              <CategoryPie data={data.byCategory} currency={currency} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground">No expenses this month</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Budget & Transactions Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget tracker (1/3) */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Budget Tracker</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly limits</p>
            </div>
            <Target size={14} className="text-muted-foreground" />
          </div>
          <div className="space-y-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`${skeletonClass} h-8`} />
                ))
              : data?.byCategory
                  ?.filter((c) => c.budgetLimit || c.spent > 0)
                  .slice(0, 6)
                  .map((c, i) => (
                    <BudgetBar key={c.id} {...c} delay={i * 0.07} />
                  ))}
            {!loading && data?.byCategory?.filter((c) => c.budgetLimit || c.spent > 0).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No budget data yet. Add expenses or set budget limits in Categories.
              </p>
            )}
          </div>
        </div>

        {/* Recent Transactions (2/3) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest 8 expenses</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`${skeletonClass} h-10`} />
              ))}
            </div>
          ) : data?.recentExpenses?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Date', 'Description', 'Category', 'Amount'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs text-muted-foreground font-medium pb-3 pr-4 last:pr-0 last:text-right"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentExpenses.map((e, i) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 pr-4 text-sm text-foreground max-w-[140px] truncate">
                        {e.description || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: e.category.color + '22',
                            color: e.category.color,
                          }}
                        >
                          {e.category.icon} {e.category.name}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                        {fmt(e.amount)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <TrendingUp size={28} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground">Add your first expense to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
