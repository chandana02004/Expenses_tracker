import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const INTERVALS = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
]
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Crypto', 'Other']

const schema = z.object({
  title:         z.string().min(1, 'Title is required'),
  amount:        z.coerce.number().positive('Must be positive'),
  categoryId:    z.string().min(1, 'Category is required'),
  paymentMethod: z.string().min(1),
  interval:      z.string().min(1),
  dayOfMonth:    z.coerce.number().min(1).max(31),
  notes:         z.string().optional(),
})

export default function RecurringModal({ open, onClose, onSave, item, categories }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', amount: '', categoryId: categories[0]?.id ?? '',
      paymentMethod: 'Cash', interval: 'monthly', dayOfMonth: 1, notes: '',
    },
  })

  useEffect(() => {
    if (item) {
      reset({ title: item.title, amount: item.amount, categoryId: item.categoryId,
        paymentMethod: item.paymentMethod, interval: item.interval,
        dayOfMonth: item.dayOfMonth, notes: item.notes ?? '' })
    } else {
      reset({ title: '', amount: '', categoryId: categories[0]?.id ?? '',
        paymentMethod: 'Cash', interval: 'monthly', dayOfMonth: 1, notes: '' })
    }
  }, [item, open])

  const onSubmit = async (data) => {
    await onSave(data, item?.id)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl">
                <h2 className="text-base font-semibold text-foreground">
                  {item ? 'Edit Recurring' : 'New Recurring Expense'}
                </h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                  <Input placeholder="e.g. Netflix, Rent, EMI" error={errors.title} {...register('title')} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</label>
                    <Input type="number" step="0.01" placeholder="0.00" error={errors.amount} {...register('amount')} />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Day of Month</label>
                    <Input type="number" min="1" max="31" placeholder="1" {...register('dayOfMonth')} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                  <select className="flex h-10 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" {...register('categoryId')}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Repeats</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {INTERVALS.map(({ value, label }) => (
                      <label key={value} className="cursor-pointer">
                        <input type="radio" value={value} className="sr-only" {...register('interval')} />
                        <span className="block text-center px-2 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground cursor-pointer transition-colors [input:checked+&]:bg-primary/10 [input:checked+&]:border-primary/40 [input:checked+&]:text-primary">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Method</label>
                  <select className="flex h-10 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" {...register('paymentMethod')}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optional)</label>
                  <textarea rows={2} placeholder="e.g. Auto-renewed subscription"
                    className="flex w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    {...register('notes')} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button type="submit" className="flex-1" loading={isSubmitting}>
                    {item ? 'Save Changes' : 'Create'}
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
