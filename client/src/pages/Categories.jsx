import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, TrendingUp,
  Wallet, AlertTriangle, CheckCircle, BarChart3,
  ArrowUpDown, SlidersHorizontal,
} from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories'
import useStore from '@/store/useStore'
import { formatCurrency } from '@/utils/currency'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import CategoryModal from '@/components/categories/CategoryModal'

/* ── helpers ── */
function getStatus(cat) {
  if (!cat.budgetLimit) return null
  const pct = (cat.monthlySpend / cat.budgetLimit) * 100
  if (pct >= 100) return 'over'
  if (pct >= 80)  return 'warning'
  return 'ok'
}

function StatusChip({ status }) {
  if (!status) return null
  const map = {
    ok:      { label: 'On Track',    cls: 'text-emerald-500 bg-emerald-500/10' },
    warning: { label: 'Near Limit',  cls: 'text-amber-500 bg-amber-500/10' },
    over:    { label: 'Over Budget', cls: 'text-red-500 bg-red-500/10' },
  }
  const s = map[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', s.cls)}>
      {status !== 'ok' && <AlertTriangle size={9} />}
      {status === 'ok' && <CheckCircle size={9} />}
      {s.label}
    </span>
  )
}

function StatCard({ label, value, sub, icon: Icon, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + '20' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight truncate">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </motion.div>
  )
}

function CategoryCard({ cat, fmt, onEdit, onDelete, index }) {
  const status   = getStatus(cat)
  const pct      = cat.budgetLimit ? Math.min((cat.monthlySpend / cat.budgetLimit) * 100, 100) : 0
  const barColor = status === 'over' ? '#ef4444' : status === 'warning' ? '#f59e0b' : cat.color

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-lg hover:shadow-black/10 transition-shadow"
    >
      {/* color top stripe */}
      <div className="h-1" style={{ backgroundColor: cat.color }} />

      <div className="p-4 space-y-3">
        {/* Icon + name + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: cat.color + '20' }}>
              {cat.icon}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{cat.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {cat.monthlyCount} expense{cat.monthlyCount !== 1 ? 's' : ''} this month
              </p>
            </div>
          </div>
          <div className="shrink-0 pt-0.5">
            {status
              ? <StatusChip status={status} />
              : <span className="text-[10px] text-muted-foreground/50">No limit</span>
            }
          </div>
        </div>

        {/* Spending */}
        <div>
          <p className="text-2xl font-bold text-foreground leading-none">
            {fmt(cat.monthlySpend)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cat.budgetLimit
              ? `of ${fmt(cat.budgetLimit)} budget`
              : `${cat.totalExpenses} total expense${cat.totalExpenses !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Progress bar */}
        {cat.budgetLimit ? (
          <div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: index * 0.05 + 0.2, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% used</span>
              <span className="text-[10px] text-muted-foreground">
                {fmt(Math.max(0, cat.budgetLimit - cat.monthlySpend))} left
              </span>
            </div>
          </div>
        ) : (
          <div className="h-5" />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button onClick={() => onEdit(cat)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Edit2 size={11} /> Edit
          </button>
          <button onClick={() => onDelete(cat)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-destructive/30 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors">
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════ Page ═══════════════════ */
export default function Categories() {
  const { user } = useStore()
  const currency  = user?.currency ?? 'USD'
  const fmt = (n) => formatCurrency(n, currency)

  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState({ open: false, category: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [search, setSearch]           = useState('')
  const [sort, setSort]               = useState('spending')
  const [filter, setFilter]           = useState('all')
  const [toast, setToast]             = useState(null)

  const load = () => {
    setLoading(true)
    getCategories()
      .then(data => setCategories(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (data, id) => {
    if (id) { await updateCategory(id, data) }
    else    { await createCategory(data) }
    load()
    showToast(id ? 'Category updated' : 'Category created')
  }

  const handleDelete = async () => {
    setDeleting(true); setDeleteError('')
    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      showToast('Category deleted')
      load()
    } catch (e) {
      setDeleteError(e.response?.data?.error || e.response?.data?.message || 'Could not delete.')
    } finally {
      setDeleting(false)
    }
  }

  /* ── derived stats ── */
  const stats = useMemo(() => ({
    totalBudget: categories.reduce((s, c) => s + (c.budgetLimit ?? 0), 0),
    totalSpent:  categories.reduce((s, c) => s + c.monthlySpend, 0),
    overBudget:  categories.filter(c => c.budgetLimit && c.monthlySpend >= c.budgetLimit).length,
  }), [categories])

  /* ── filter + sort ── */
  const displayed = useMemo(() => {
    let list = [...categories]
    if (search)            list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'over') list = list.filter(c => c.budgetLimit && c.monthlySpend >= c.budgetLimit)
    if (filter === 'warn') list = list.filter(c => c.budgetLimit && c.monthlySpend / c.budgetLimit >= 0.8 && c.monthlySpend < c.budgetLimit)
    if (filter === 'none') list = list.filter(c => !c.budgetLimit)
    if (sort === 'spending') list.sort((a, b) => b.monthlySpend - a.monthlySpend)
    if (sort === 'name')     list.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'budget')   list.sort((a, b) => {
      const pa = a.budgetLimit ? a.monthlySpend / a.budgetLimit : 0
      const pb = b.budgetLimit ? b.monthlySpend / b.budgetLimit : 0
      return pb - pa
    })
    if (sort === 'count')    list.sort((a, b) => b.totalExpenses - a.totalExpenses)
    return list
  }, [categories, search, sort, filter])

  const topThree = useMemo(() =>
    [...categories].sort((a, b) => b.monthlySpend - a.monthlySpend).slice(0, 3).filter(c => c.monthlySpend > 0),
  [categories])

  const SORTS   = [{ v:'spending',label:'Spending'},{v:'name',label:'Name'},{v:'budget',label:'Budget %'},{v:'count',label:'Expenses'}]
  const FILTERS = [{ v:'all',label:'All'},{v:'over',label:'Over Budget'},{v:'warn',label:'Near Limit'},{v:'none',label:'No Budget'}]

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} ·{' '}
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button size="sm" onClick={() => setModal({ open: true, category: null })}>
          <Plus size={13} /> New Category
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Categories"      value={categories.length}                        icon={BarChart3}     color="#8b5cf6" delay={0}    />
        <StatCard label="Spent This Month" value={fmt(stats.totalSpent)}                   icon={TrendingUp}    color="#f97316" delay={0.05} />
        <StatCard label="Total Budgeted"  value={stats.totalBudget ? fmt(stats.totalBudget) : '—'}
          sub={`${categories.filter(c=>c.budgetLimit).length} with limits`}                icon={Wallet}        color="#06b6d4" delay={0.1}  />
        <StatCard label="Over Budget"     value={stats.overBudget}
          sub={stats.overBudget ? 'Need attention' : 'All within limits'}                  icon={AlertTriangle} color={stats.overBudget ? '#ef4444' : '#22c55e'} delay={0.15} />
      </div>

      {/* Top spenders */}
      {topThree.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Top Spenders This Month</h2>
          <div className="space-y-3">
            {topThree.map((cat, i) => {
              const pct = stats.totalSpent > 0 ? (cat.monthlySpend / stats.totalSpent) * 100 : 0
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-base w-5 shrink-0">{['🥇','🥈','🥉'][i]}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: cat.color + '20' }}>{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      <span className="text-sm font-bold text-foreground">{fmt(cat.monthlySpend)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + Sort + Filter */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-wrap">
        <div className="relative w-full sm:w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 pl-8 text-sm" placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <ArrowUpDown size={11} />
          </span>
          {SORTS.map(s => (
            <button key={s.v} onClick={() => setSort(s.v)}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                sort === s.v ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <SlidersHorizontal size={11} />
          </span>
          {FILTERS.map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                filter === f.v ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl">
            {search ? '🔍' : '🗂️'}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {search ? 'No categories match' : filter !== 'all' ? 'No categories in this filter' : 'No categories yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {!search && filter === 'all' ? 'Create your first category to start tracking' : 'Try adjusting your filters'}
            </p>
          </div>
          {!search && filter === 'all' && (
            <Button size="sm" onClick={() => setModal({ open: true, category: null })}>
              <Plus size={13} /> New Category
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayed.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} fmt={fmt} index={i}
              onEdit={c  => setModal({ open: true, category: c })}
              onDelete={c => { setDeleteTarget(c); setDeleteError('') }}
            />
          ))}
        </div>
      )}

      {/* Category modal */}
      <CategoryModal
        open={modal.open}
        category={modal.category}
        onClose={() => setModal({ open: false, category: null })}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => { setDeleteTarget(null); setDeleteError('') }} />
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}>
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: deleteTarget.color + '20' }}>
                    {deleteTarget.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Delete "{deleteTarget.name}"?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">This cannot be undone.</p>
                  </div>
                </div>
                {deleteError && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                    <AlertTriangle size={13} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{deleteError}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1"
                    onClick={() => { setDeleteTarget(null); setDeleteError('') }}>Cancel</Button>
                  <Button variant="destructive" size="sm" className="flex-1"
                    loading={deleting} onClick={handleDelete}>Delete</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium',
              toast.type === 'error'
                ? 'bg-destructive text-white'
                : 'bg-card border border-border text-foreground'
            )}
          >
            {toast.type !== 'error' && <CheckCircle size={14} className="text-emerald-500" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
