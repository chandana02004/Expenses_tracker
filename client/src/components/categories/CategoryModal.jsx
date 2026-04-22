import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

const COLORS = [
  '#ef4444','#f97316','#eab308','#84cc16',
  '#22c55e','#10b981','#14b8a6','#06b6d4',
  '#3b82f6','#6366f1','#8b5cf6','#a855f7',
  '#ec4899','#f43f5e','#64748b','#78716c',
]

const EMOJIS = [
  '🍔','🍕','🍜','🍺','☕','🛒','🥗','🍣','🍰','🍦',
  '🚗','✈️','🚌','🚲','⛽','🚇','🛺','🚕','🛵','🚢',
  '🛍️','👗','👟','💄','💍','🎒','👔','🕶️','👜','🧢',
  '💊','🏥','💪','🧘','🩺','🏃','🧴','🛁','🩹','🧠',
  '🎬','🎮','🎵','📚','🎭','🎯','🎲','🎨','🎤','🎧',
  '🏠','💡','🔧','🛋️','🪴','🔑','🚿','🪣','🧹','🏡',
  '💰','💳','📈','🏦','💵','🪙','📊','💹','🧾','💼',
  '📦','🎁','🐕','👶','✂️','📱','💻','🖥️','📷','🎓',
]

function Toggle({ id, checked, onChange }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer',
        checked ? 'bg-primary' : 'bg-border'
      )}
      style={{ width: 32, height: 18 }}
    >
      <span className={cn(
        'inline-block rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-3.5' : 'translate-x-0'
      )} style={{ width: 14, height: 14 }} />
    </button>
  )
}

export default function CategoryModal({ open, onClose, onSave, category }) {
  const [name, setName]               = useState('')
  const [nameError, setNameError]     = useState('')
  const [color, setColor]             = useState(COLORS[8])
  const [icon, setIcon]               = useState('📦')
  const [hasBudget, setHasBudget]     = useState(false)
  const [budgetValue, setBudgetValue] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const [apiError, setApiError]       = useState('')
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name)
        setColor(category.color)
        setIcon(category.icon)
        setHasBudget(!!category.budgetLimit)
        setBudgetValue(category.budgetLimit ? String(category.budgetLimit) : '')
      } else {
        setName('')
        setColor(COLORS[8])
        setIcon('📦')
        setHasBudget(false)
        setBudgetValue('')
      }
      setNameError('')
      setBudgetError('')
      setApiError('')
      setSaving(false)
    }
  }, [category, open])

  const validate = () => {
    let ok = true
    if (!name.trim()) { setNameError('Name is required'); ok = false }
    else if (name.trim().length > 30) { setNameError('Max 30 characters'); ok = false }
    else setNameError('')

    if (hasBudget) {
      const n = parseFloat(budgetValue)
      if (!budgetValue || isNaN(n) || n <= 0) { setBudgetError('Enter a valid positive amount'); ok = false }
      else setBudgetError('')
    } else {
      setBudgetError('')
    }
    return ok
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setApiError('')
    setSaving(true)
    try {
      await onSave({
        name:        name.trim(),
        icon,
        color,
        budgetLimit: hasBudget && budgetValue ? parseFloat(budgetValue) : null,
      }, category?.id)
      onClose()
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: color + '25' }}
                  >
                    {icon}
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {category ? 'Edit Category' : 'New Category'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="px-5 py-4 space-y-4">

                {/* API error */}
                {apiError && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                    <AlertCircle size={13} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{apiError}</p>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="cat-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category Name
                  </label>
                  <input
                    id="cat-name"
                    name="categoryName"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Food, Transport, Shopping"
                    value={name}
                    onChange={e => { setName(e.target.value); setNameError('') }}
                    className={cn(
                      'flex h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors',
                      nameError ? 'border-destructive' : 'border-border focus:border-primary'
                    )}
                  />
                  {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                </div>

                {/* Color + Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color</p>
                    <div className="grid grid-cols-8 gap-1.5">
                      {COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setColor(c)}
                          className={cn(
                            'w-full aspect-square rounded-md transition-transform hover:scale-110',
                            color === c && 'ring-2 ring-offset-2 ring-offset-card scale-110'
                          )}
                          style={{ backgroundColor: c, '--tw-ring-color': c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
                    <div
                      className="flex flex-col items-center justify-center gap-1.5 h-[60px] rounded-xl border border-border"
                      style={{ backgroundColor: color + '12' }}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-[10px] font-semibold" style={{ color }}>{color.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Emoji picker */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Icon</p>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-10 max-h-[108px] overflow-y-auto p-1.5 gap-0">
                      {EMOJIS.map((e, i) => (
                        <button key={i} type="button" onClick={() => setIcon(e)}
                          className={cn(
                            'flex items-center justify-center w-full aspect-square text-lg rounded-lg transition-colors hover:bg-secondary',
                            icon === e && 'bg-primary/10 ring-1 ring-primary/40'
                          )}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Budget toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="cat-budget-toggle" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Monthly Budget
                    </label>
                    <Toggle
                      id="cat-budget-toggle"
                      checked={hasBudget}
                      onChange={v => { setHasBudget(v); setBudgetError('') }}
                    />
                  </div>

                  <AnimatePresence>
                    {hasBudget && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label htmlFor="cat-budget-amount" className="sr-only">Budget amount</label>
                        <div className="relative">
                          <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            id="cat-budget-amount"
                            name="budgetAmount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="e.g. 5000"
                            value={budgetValue}
                            onChange={e => { setBudgetValue(e.target.value); setBudgetError('') }}
                            className={cn(
                              'flex h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors',
                              budgetError ? 'border-destructive' : 'border-border focus:border-primary'
                            )}
                          />
                        </div>
                        {budgetError && <p className="text-xs text-destructive mt-1">{budgetError}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Alert fires when spending reaches 80% of this limit.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-9 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: color, borderColor: color }}
                  >
                    {saving ? 'Saving…' : category ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
