import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Paperclip, Repeat } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Crypto', 'Other']
const INTERVALS = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
]

const schema = z.object({
  description:   z.string().min(1, 'Title is required'),
  amount:        z.coerce.number().positive('Must be a positive number'),
  date:          z.string().min(1, 'Date is required'),
  categoryId:    z.string().min(1, 'Category is required'),
  paymentMethod: z.string().min(1),
  notes:         z.string().optional(),
  interval:      z.string().optional(),
  dayOfMonth:    z.coerce.number().min(1).max(31).optional(),
})

function Lbl({ children }) {
  return (
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </label>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 cursor-pointer focus:outline-none',
        checked ? 'bg-primary' : 'bg-border'
      )}
    >
      <span className={cn(
        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
        checked ? 'translate-x-4' : 'translate-x-0'
      )} />
    </button>
  )
}

export default function ExpenseModal({ open, onClose, onSave, onSaveRecurring, expense, categories }) {
  const [receipt, setReceipt]         = useState(null)
  const [preview, setPreview]         = useState(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const fileRef = useRef()

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '', amount: '', date: new Date().toISOString().split('T')[0],
      categoryId: categories[0]?.id ?? '', paymentMethod: 'Cash',
      notes: '', interval: 'monthly', dayOfMonth: 1,
    },
  })

  const selectedInterval = watch('interval') ?? 'monthly'

  useEffect(() => {
    if (expense) {
      reset({
        description:   expense.description ?? '',
        amount:        expense.amount,
        date:          new Date(expense.date).toISOString().split('T')[0],
        categoryId:    expense.categoryId,
        paymentMethod: expense.paymentMethod,
        notes:         expense.notes ?? '',
        interval: 'monthly', dayOfMonth: 1,
      })
      setPreview(expense.receipt ? `/uploads/${expense.receipt}` : null)
      setIsRecurring(false)
    } else {
      reset({
        description: '', amount: '', date: new Date().toISOString().split('T')[0],
        categoryId: categories[0]?.id ?? '', paymentMethod: 'Cash',
        notes: '', interval: 'monthly', dayOfMonth: 1,
      })
      setPreview(null); setReceipt(null); setIsRecurring(false)
    }
  }, [expense, open])

  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setReceipt(f)
    setPreview(URL.createObjectURL(f))
  }

  const onSubmit = async (data) => {
    if (isRecurring && !expense) {
      await onSaveRecurring({
        title: data.description, amount: data.amount,
        categoryId: data.categoryId, paymentMethod: data.paymentMethod,
        notes: data.notes, interval: data.interval ?? 'monthly',
        dayOfMonth: data.dayOfMonth ?? 1,
      })
    } else {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && k !== 'interval' && k !== 'dayOfMonth') fd.append(k, v)
      })
      if (receipt) fd.append('receipt', receipt)
      await onSave(fd, expense?.id)
    }
    onClose()
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
            {/* Modal — overflow-hidden so nothing scrolls */}
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
                <h2 className="text-sm font-semibold text-foreground">
                  {expense ? 'Edit Expense' : 'Add Expense'}
                </h2>
                <button onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-5 pt-3 pb-4 space-y-2.5">

                {/* Title */}
                <div className="space-y-1.5">
                  <Lbl>Title</Lbl>
                  <Input className="h-9" placeholder="e.g. Groceries, Uber, Netflix"
                    error={errors.description} {...register('description')} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>

                {/* Amount + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Lbl>Amount</Lbl>
                    <Input className="h-9" type="number" step="0.01" placeholder="0.00"
                      error={errors.amount} {...register('amount')} />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Lbl>Date</Lbl>
                    <Input className="h-9" type="date" error={errors.date} {...register('date')} />
                    {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Lbl>Category</Lbl>
                  <select
                    className={cn(
                      'flex h-9 w-full rounded-md border bg-secondary/50 px-3 py-1.5 text-sm text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                      errors.categoryId ? 'border-destructive' : 'border-border'
                    )}
                    {...register('categoryId')}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>

                {/* Payment Method — pill radio (old style) */}
                <div className="space-y-1.5">
                  <Lbl>Payment Method</Lbl>
                  <div className="flex flex-wrap gap-1.5">
                    {PAYMENT_METHODS.map(m => (
                      <label key={m} className="cursor-pointer">
                        <input type="radio" value={m} className="sr-only" {...register('paymentMethod')} />
                        <span className={cn(
                          'inline-block px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors',
                          'border-border text-muted-foreground hover:text-foreground',
                          '[input:checked+&]:bg-primary/10 [input:checked+&]:border-primary/40 [input:checked+&]:text-primary'
                        )}>
                          {m}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes + Receipt OR Notes + Recurring — side by side */}
                <div className="grid grid-cols-5 gap-3">
                  {/* Notes — always left */}
                  <div className="col-span-3 space-y-1.5">
                    <Lbl>Notes (optional)</Lbl>
                    <textarea
                      rows={isRecurring && !expense ? 3 : 2}
                      placeholder="Any additional notes..."
                      className="flex w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors"
                      {...register('notes')}
                    />
                  </div>

                  {/* Right panel — Receipt normally, Recurring fields when toggled */}
                  <div className="col-span-2 space-y-1.5">
                    {isRecurring && !expense ? (
                      <>
                        <Lbl>Repeats</Lbl>
                        <div className="grid grid-cols-2 gap-1.5">
                          {INTERVALS.map(({ value, label }) => (
                            <label key={value} className="cursor-pointer">
                              <input type="radio" value={value} className="sr-only" {...register('interval')} />
                              <span className={cn(
                                'block text-center py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                                selectedInterval === value
                                  ? 'bg-primary/10 border-primary/40 text-primary'
                                  : 'border-border text-muted-foreground hover:text-foreground'
                              )}>
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="space-y-1 pt-1">
                          <Lbl>Day of month</Lbl>
                          <Input className="h-9" type="number" min="1" max="31" placeholder="1"
                            {...register('dayOfMonth')} />
                          <p className="text-[10px] text-muted-foreground">Billing day (1–31)</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Lbl>Receipt (optional)</Lbl>
                        <input ref={fileRef} type="file" accept="image/*,.pdf"
                          className="sr-only" onChange={onFileChange} />
                        {preview ? (
                          <div className="relative rounded-lg border border-border overflow-hidden h-[calc(100%-26px)]">
                            {preview.match(/\.(jpg|jpeg|png|gif|webp)/i) || receipt ? (
                              <img src={preview} alt="Receipt"
                                className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-1.5 p-2">
                                <Paperclip size={14} className="text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground text-center">Receipt attached</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => { setReceipt(null); setPreview(null) }}
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="w-full h-[calc(100%-26px)] min-h-[80px] border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                          >
                            <Upload size={15} />
                            <span className="text-[10px] text-center leading-tight">Click to upload<br/>PNG, JPG, PDF</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Recurring toggle — only on new expense */}
                {!expense && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3.5 py-2">
                    <div className="flex items-center gap-2.5">
                      <Repeat size={13} className={isRecurring ? 'text-primary' : 'text-muted-foreground'} />
                      <div>
                        <p className="text-xs font-medium text-foreground">Make this recurring</p>
                        <p className="text-[10px] text-muted-foreground">Save as a recurring expense</p>
                      </div>
                    </div>
                    <Toggle checked={isRecurring} onChange={setIsRecurring} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-0.5">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="flex-1" loading={isSubmitting}>
                    {expense ? 'Save Changes' : isRecurring ? 'Create Recurring' : 'Add Expense'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
