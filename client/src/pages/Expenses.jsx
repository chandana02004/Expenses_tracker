import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, Download, Edit2, Trash2, Eye,
  RefreshCw, ChevronLeft, ChevronRight, Repeat, X,
  TrendingUp, Wallet, BarChart3, Calendar,
} from 'lucide-react'
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getRecurring, createRecurring, updateRecurring, deleteRecurring,
  applyRecurring, exportCSV,
} from '@/api/expenses'
import { getCategories } from '@/api/categories'
import useStore from '@/store/useStore'
import { formatCurrency } from '@/utils/currency'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ExpenseModal from '@/components/expenses/ExpenseModal'
import RecurringModal from '@/components/expenses/RecurringModal'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Crypto', 'Other']

/* ── helpers ── */
function Badge({ color, icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '22', color }}>
      {icon} {label}
    </span>
  )
}

function MethodBadge({ method }) {
  const colors = {
    'Cash': '#22c55e', 'Credit Card': '#a855f7', 'Debit Card': '#3b82f6',
    'UPI': '#f97316', 'Bank Transfer': '#06b6d4', 'Crypto': '#eab308', 'Other': '#6b7280',
  }
  const color = colors[method] ?? '#6b7280'
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '22', color }}>
      {method}
    </span>
  )
}

function StatMini({ label, value, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + '22' }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════ */
export default function Expenses() {
  const { user } = useStore()
  const currency = user?.currency ?? 'USD'
  const fmt = (n) => formatCurrency(n, currency)

  const [expenses, setExpenses]       = useState([])
  const [total, setTotal]             = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [page, setPage]               = useState(1)
  const [categories, setCategories]   = useState([])
  const [recurring, setRecurring]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [exporting, setExporting]     = useState(false)

  // Modals
  const [expModal, setExpModal]       = useState({ open: false, expense: null })
  const [recModal, setRecModal]       = useState({ open: false, item: null })
  const [deleteId, setDeleteId]       = useState(null)
  const [viewExpense, setViewExpense] = useState(null)

  // Filters
  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [sort, setSort]               = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page, limit: 12, sort,
        ...(search     && { search }),
        ...(filterCat  && { categoryId: filterCat }),
        ...(filterMethod && { paymentMethod: filterMethod }),
        ...(startDate  && { startDate }),
        ...(endDate    && { endDate }),
      }
      const r = await getExpenses(params)
      setExpenses(r.data.expenses)
      setTotal(r.data.total)
      setTotalPages(r.data.totalPages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, search, filterCat, filterMethod, startDate, endDate, sort])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])
  useEffect(() => {
    getCategories().then(cats => setCategories(Array.isArray(cats) ? cats : cats?.data ?? [])).catch(console.error)
    getRecurring().then(r => setRecurring(r.data)).catch(console.error)
  }, [])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, filterCat, filterMethod, startDate, endDate, sort])

  /* Analytics from current data */
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTotal = expenses.reduce((s, e) => {
    if (new Date(e.date).toISOString().slice(0, 7) === thisMonth) return s + e.amount
    return s
  }, 0)
  const topCat = (() => {
    const map = {}
    expenses.forEach(e => { map[e.category.name] = (map[e.category.name] ?? 0) + e.amount })
    const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : '—'
  })()
  const avgDaily = expenses.length
    ? (expenses.reduce((s, e) => s + e.amount, 0) / Math.max(1, new Set(expenses.map(e => e.date.slice(0, 10))).size)).toFixed(2)
    : 0

  /* Pie data */
  const pieData = (() => {
    const map = {}
    expenses.forEach(e => {
      if (!map[e.category.name]) map[e.category.name] = { name: e.category.name, color: e.category.color, value: 0 }
      map[e.category.name].value += e.amount
    })
    return Object.values(map)
  })()

  /* CRUD handlers */
  const handleSaveExpense = async (formData, id) => {
    if (id) { await updateExpense(id, formData) }
    else    { await createExpense(formData) }
    fetchExpenses()
  }

  const handleDelete = async (id) => {
    await deleteExpense(id)
    setDeleteId(null)
    fetchExpenses()
  }

  const handleSaveRecurring = async (data, id) => {
    if (id) {
      const r = await updateRecurring(id, data)
      setRecurring(p => p.map(x => x.id === id ? r.data : x))
    } else {
      const r = await createRecurring(data)
      setRecurring(p => [...p, r.data])
    }
    getRecurring().then(r => setRecurring(r.data)).catch(console.error)
  }

  const handleApply = async (id) => {
    await applyRecurring(id)
    fetchExpenses()
  }

  const handleExport = async () => {
    setExporting(true)
    try { await exportCSV({ search, categoryId: filterCat, paymentMethod: filterMethod, startDate, endDate }) }
    finally { setExporting(false) }
  }

  const clearFilters = () => {
    setSearch(''); setFilterCat(''); setFilterMethod('')
    setStartDate(''); setEndDate(''); setSort('newest')
  }
  const hasFilters = search || filterCat || filterMethod || startDate || endDate

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} record{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} loading={exporting}>
            <Download size={13} /> Export
          </Button>
          <Button size="sm" onClick={() => setExpModal({ open: true, expense: null })}>
            <Plus size={13} /> Add Expense
          </Button>
        </div>
      </div>

      {/* ── Mini Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-16 animate-pulse flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/60 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-2.5 w-16 bg-secondary/50 rounded" />
                <div className="h-4 w-20 bg-secondary/70 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatMini label="Total records"   value={total}           icon={Wallet}    color="hsl(263,70%,65%)" />
            <StatMini label="This month"      value={fmt(monthTotal)} icon={Calendar}  color="#f97316" />
            <StatMini label="Top category"    value={topCat}          icon={BarChart3} color="#22c55e" />
            <StatMini label="Avg daily spend" value={fmt(avgDaily)}   icon={TrendingUp} color="#06b6d4" />
          </>
        )}
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or note…"
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(v => !v)}
            className={cn('shrink-0', showFilters && 'border-primary text-primary')}>
            <Filter size={14} />
          </Button>
          {hasFilters && (
            <Button variant="outline" size="icon" onClick={clearFilters} className="shrink-0 text-destructive border-destructive/50">
              <X size={14} />
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Category</label>
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">All categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Payment</label>
                  <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">All methods</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">From</label>
                  <Input type="date" className="h-9" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">To</label>
                  <Input type="date" className="h-9" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {['newest','oldest','highest','lowest'].map(s => (
                  <button key={s} onClick={() => setSort(s)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize',
                      sort === s ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main Content: Table + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table (2/3) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-secondary/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Wallet size={36} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No expenses found</p>
              <Button size="sm" onClick={() => setExpModal({ open: true, expense: null })}>
                <Plus size={13} /> Add your first expense
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      {['Date','Title','Category','Amount','Method',''].map(h => (
                        <th key={h} className="text-left text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-4 py-3 last:text-right whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e, i) => (
                      <motion.tr key={e.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors group">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(e.date).toLocaleDateString('en',{month:'short',day:'numeric',year:'2-digit'})}
                        </td>
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="text-sm text-foreground truncate">{e.description || '—'}</p>
                          {e.notes && <p className="text-[10px] text-muted-foreground truncate">{e.notes}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={e.category.color} icon={e.category.icon} label={e.category.name} />
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">
                          {fmt(e.amount)}
                          {e.receipt && <span className="ml-1 text-[10px] text-primary">📎</span>}
                        </td>
                        <td className="px-4 py-3"><MethodBadge method={e.paymentMethod} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewExpense(e)}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                              <Eye size={13} />
                            </button>
                            <button onClick={() => setExpModal({ open: true, expense: e })}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => setDeleteId(e.id)}
                              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {expenses.map((e, i) => (
                  <motion.div key={e.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: e.category.color + '22' }}>
                      {e.category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{e.description || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(e.date).toLocaleDateString('en',{month:'short',day:'numeric'})} · {e.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{fmt(e.amount)}</p>
                      <div className="flex gap-1 mt-1 justify-end">
                        <button onClick={() => setExpModal({ open: true, expense: e })}
                          className="p-1 text-muted-foreground hover:text-foreground"><Edit2 size={11} /></button>
                        <button onClick={() => setDeleteId(e.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                      <ChevronLeft size={13} />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie chart (1/3) */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">By Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Current results</p>
          {pieData.length > 0 ? (
            <>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                      innerRadius="50%" outerRadius="75%" paddingAngle={3} strokeWidth={0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3">
                {pieData.slice(0, 6).map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground truncate max-w-[90px]">{d.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-xs text-muted-foreground">No data</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recurring Expenses ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Repeat size={14} className="text-primary" /> Recurring Expenses
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Subscriptions, rent, EMIs</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setRecModal({ open: true, item: null })}>
            <Plus size={13} /> Add
          </Button>
        </div>

        {recurring.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No recurring expenses yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recurring.map((r, i) => (
              <motion.div key={r.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn('border border-border rounded-xl p-4 space-y-3', !r.isActive && 'opacity-50')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ backgroundColor: r.category.color + '22' }}>
                      {r.category.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{r.interval} · day {r.dayOfMonth}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground">{fmt(r.amount)}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1 text-xs"
                    onClick={() => handleApply(r.id)}>
                    <RefreshCw size={11} /> Add Now
                  </Button>
                  <button onClick={() => setRecModal({ open: true, item: r })}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => deleteRecurring(r.id).then(() => setRecurring(p => p.filter(x => x.id !== r.id)))}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ExpenseModal
        open={expModal.open}
        expense={expModal.expense}
        categories={categories}
        onClose={() => setExpModal({ open: false, expense: null })}
        onSave={handleSaveExpense}
        onSaveRecurring={handleSaveRecurring}
      />
      <RecurringModal
        open={recModal.open}
        item={recModal.item}
        categories={categories}
        onClose={() => setRecModal({ open: false, item: null })}
        onSave={handleSaveRecurring}
      />

      {/* View expense detail */}
      <AnimatePresence>
        {viewExpense && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setViewExpense(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}>
              <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Expense Detail</h2>
                  <button onClick={() => setViewExpense(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: viewExpense.category.color + '22' }}>
                    {viewExpense.category.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{viewExpense.description || '—'}</p>
                    <p className="text-xs text-muted-foreground">{viewExpense.category.name}</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground">{fmt(viewExpense.amount)}</div>
                {[
                  ['Date', new Date(viewExpense.date).toLocaleDateString('en',{dateStyle:'long'})],
                  ['Payment', viewExpense.paymentMethod],
                  ['Notes', viewExpense.notes || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-t border-border pt-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground font-medium">{v}</span>
                  </div>
                ))}
                {viewExpense.receipt && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Receipt</p>
                    <img src={`/uploads/${viewExpense.receipt}`} alt="Receipt"
                      className="w-full rounded-lg border border-border max-h-48 object-cover" />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}>
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
                  <Trash2 size={20} className="text-destructive" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">Delete expense?</h3>
                  <p className="text-sm text-muted-foreground mt-1">This action cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteId)}>Delete</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
