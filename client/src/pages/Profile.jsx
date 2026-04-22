import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Shield, Settings, Target, Database,
  Check, AlertTriangle, Eye, EyeOff, Sun, Moon,
  Download, Trash2, LogOut, Bell, Globe, Calendar,
  DollarSign, Briefcase, Phone, Mail, Clock,
} from 'lucide-react'
import useStore from '@/store/useStore'
import { getMe, updateMe, changePassword, deleteAccount } from '@/api/auth'
import { getCategories, updateCategory } from '@/api/categories'
import { exportCSV } from '@/api/expenses'
import { CURRENCIES, formatCurrency } from '@/utils/currency'
import { cn } from '@/utils/cn'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

/* ── Helpers ── */
function avatarColor(name = '') {
  const colors = ['#a855f7','#3b82f6','#06b6d4','#22c55e','#f97316','#ec4899','#eab308','#ef4444']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(h)]
}

function Toast({ msg, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-xl',
        type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-destructive/10 border-destructive/30 text-destructive'
      )}
    >
      {type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
      {msg}
    </motion.div>
  )
}

const TABS = [
  { id: 'personal',     label: 'Personal Info', icon: User },
  { id: 'security',     label: 'Security',      icon: Shield },
  { id: 'preferences',  label: 'Preferences',   icon: Settings },
  { id: 'budgets',      label: 'Budgets',        icon: Target },
  { id: 'data',         label: 'Data & Privacy', icon: Database },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const LANGUAGES = [{ code:'en', label:'English' },{ code:'hi', label:'Hindi' },{ code:'es', label:'Spanish' },{ code:'fr', label:'French' }]

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.15 } },
}

/* ════════════════════════════════════════ */
export default function Profile() {
  const { user, setUser, theme, toggleTheme, logout } = useStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('personal')
  const [profile, setProfile] = useState(null)
  const [categories, setCategories] = useState([])
  const [toast, setToast] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    getMe().then(r => setProfile(r.data.user)).catch(console.error)
    getCategories().then(r => setCategories(r.data.categories ?? r.data)).catch(console.error)
  }, [])

  const color = avatarColor(user?.name)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Profile Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5"
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0 shadow-lg"
          style={{ backgroundColor: color }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </div>

        <div className="text-center sm:text-left flex-1">
          <h1 className="text-xl font-semibold text-foreground">{user?.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{profile?.occupation || 'No occupation set'}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail size={11} />{user?.email}
            </span>
            {profile?.phone && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone size={11} />{profile.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={11} />Joined {new Date(user?.createdAt ?? Date.now()).toLocaleDateString('en',{month:'short',year:'numeric'})}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex sm:flex-col gap-4 sm:gap-2 text-center shrink-0">
          <div>
            <p className="text-lg font-bold text-foreground">{user?.currency}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Currency</p>
          </div>
          {profile?.lastLoginAt && (
            <div>
              <p className="text-xs font-medium text-foreground">
                {new Date(profile.lastLoginAt).toLocaleDateString('en',{month:'short',day:'numeric'})}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Login</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-secondary/50 border border-border rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center',
              activeTab === id
                ? 'bg-card border border-border text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="show" exit="exit">
          {activeTab === 'personal'    && <PersonalTab    profile={profile} setProfile={setProfile} setUser={setUser} showToast={showToast} />}
          {activeTab === 'security'    && <SecurityTab    profile={profile} showToast={showToast} logout={logout} navigate={navigate} />}
          {activeTab === 'preferences' && <PreferencesTab profile={profile} setProfile={setProfile} setUser={setUser} showToast={showToast} theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'budgets'     && <BudgetsTab     categories={categories} setCategories={setCategories} showToast={showToast} currency={user?.currency} />}
          {activeTab === 'data'        && <DataTab        showToast={showToast} showDeleteConfirm={showDeleteConfirm} setShowDeleteConfirm={setShowDeleteConfirm} logout={logout} navigate={navigate} />}
        </motion.div>
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB: Personal Info
══════════════════════════════════════════ */
function PersonalTab({ profile, setProfile, setUser, showToast }) {
  const schema = z.object({
    name:       z.string().min(1, 'Name is required'),
    email:      z.string().email('Valid email required'),
    phone:      z.string().optional(),
    occupation: z.string().optional(),
  })
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema),
    values: { name: profile?.name ?? '', email: profile?.email ?? '', phone: profile?.phone ?? '', occupation: profile?.occupation ?? '' },
  })

  const onSubmit = async (data) => {
    try {
      const r = await updateMe(data)
      setProfile(r.data.user)
      setUser(r.data.user)
      showToast('Profile updated successfully')
    } catch (e) {
      showToast(e.response?.data?.error || 'Update failed', 'error')
    }
  }

  return (
    <Card title="Personal Information" desc="Update your name, contact and job details.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" icon={User} error={errors.name}>
            <Input placeholder="Jane Smith" error={errors.name} {...register('name')} />
            {errors.name && <Err>{errors.name.message}</Err>}
          </Field>
          <Field label="Email Address" icon={Mail} error={errors.email}>
            <Input type="email" placeholder="you@example.com" error={errors.email} {...register('email')} />
            {errors.email && <Err>{errors.email.message}</Err>}
          </Field>
          <Field label="Phone (optional)" icon={Phone}>
            <Input placeholder="+1 234 567 8900" {...register('phone')} />
          </Field>
          <Field label="Occupation (optional)" icon={Briefcase}>
            <Input placeholder="e.g. Software Engineer" {...register('occupation')} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </Card>
  )
}

/* ══════════════════════════════════════════
   TAB: Security
══════════════════════════════════════════ */
function SecurityTab({ profile, showToast, logout, navigate }) {
  const schema = z.object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword:     z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  }).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const onSubmit = async (data) => {
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      showToast('Password changed successfully')
      reset()
    } catch (e) {
      showToast(e.response?.data?.error || 'Password change failed', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Change Password" desc="Use a strong password you don't use elsewhere.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Current Password" icon={Shield}>
            <PasswordInput show={showCur} onToggle={() => setShowCur(v=>!v)} error={errors.currentPassword} {...register('currentPassword')} placeholder="Current password" />
            {errors.currentPassword && <Err>{errors.currentPassword.message}</Err>}
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New Password" icon={Shield}>
              <PasswordInput show={showNew} onToggle={() => setShowNew(v=>!v)} error={errors.newPassword} {...register('newPassword')} placeholder="Min. 8 characters" />
              {errors.newPassword && <Err>{errors.newPassword.message}</Err>}
            </Field>
            <Field label="Confirm New Password" icon={Shield}>
              <PasswordInput show={showNew} onToggle={() => setShowNew(v=>!v)} error={errors.confirmPassword} {...register('confirmPassword')} placeholder="Re-enter new password" />
              {errors.confirmPassword && <Err>{errors.confirmPassword.message}</Err>}
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting}>Update Password</Button>
          </div>
        </form>
      </Card>

      <Card title="Session Info" desc="Details about your last login.">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Last login</p>
              <p className="text-xs text-muted-foreground">
                {profile?.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleString()
                  : 'Not available'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { logout(); navigate('/login') }}
          >
            <LogOut size={13} /> Logout
          </Button>
        </div>
      </Card>
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB: Preferences
══════════════════════════════════════════ */
function PreferencesTab({ profile, setProfile, setUser, showToast, theme, toggleTheme }) {
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState({
    currency:           profile?.currency           ?? 'USD',
    monthlyIncome:      profile?.monthlyIncome      ?? '',
    salaryDate:         profile?.salaryDate          ?? '',
    financialYearStart: profile?.financialYearStart  ?? 1,
    language:           profile?.language            ?? 'en',
    notifications:      profile?.notifications       ?? true,
    alertThreshold:     profile?.alertThreshold      ?? 80,
  })

  useEffect(() => {
    if (profile) setLocal({
      currency: profile.currency, monthlyIncome: profile.monthlyIncome ?? '',
      salaryDate: profile.salaryDate ?? '', financialYearStart: profile.financialYearStart ?? 1,
      language: profile.language, notifications: profile.notifications,
      alertThreshold: profile.alertThreshold,
    })
  }, [profile])

  const save = async () => {
    setSaving(true)
    try {
      const r = await updateMe(local)
      setProfile(r.data.user)
      setUser(r.data.user)
      showToast('Preferences saved')
    } catch { showToast('Save failed', 'error') }
    finally { setSaving(false) }
  }

  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      {/* Financial */}
      <Card title="Financial Settings" desc="Set your income and fiscal year preferences.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Default Currency" icon={DollarSign}>
            <select
              value={local.currency}
              onChange={e => set('currency', e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
              ))}
            </select>
          </Field>
          <Field label="Monthly Income (optional)" icon={DollarSign}>
            <Input type="number" placeholder="e.g. 5000" value={local.monthlyIncome} onChange={e => set('monthlyIncome', e.target.value)} />
          </Field>
          <Field label="Salary Date (day of month)" icon={Calendar}>
            <Input type="number" min="1" max="31" placeholder="e.g. 25" value={local.salaryDate} onChange={e => set('salaryDate', e.target.value)} />
          </Field>
          <Field label="Financial Year Start" icon={Calendar}>
            <select
              value={local.financialYearStart}
              onChange={e => set('financialYearStart', parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {/* UI */}
      <Card title="Appearance & Notifications" desc="Control how the app looks and alerts you.">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={15} className="text-muted-foreground" /> : <Sun size={15} className="text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
              </div>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-3">
              <Bell size={15} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Budget Alerts</p>
                <p className="text-xs text-muted-foreground">Notify when nearing limits</p>
              </div>
            </div>
            <Toggle checked={local.notifications} onChange={() => set('notifications', !local.notifications)} />
          </div>

          <div className="flex items-center gap-3">
            <Globe size={15} className="text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">Language</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => set('language', l.code)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      local.language === l.code
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>Save Preferences</Button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB: Budgets
══════════════════════════════════════════ */
function BudgetsTab({ categories, setCategories, showToast, currency }) {
  const [budgets, setBudgets] = useState({})
  const [threshold, setThreshold] = useState(80)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = {}
    categories.forEach(c => { init[c.id] = c.budgetLimit ?? '' })
    setBudgets(init)
  }, [categories])

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all(
        categories.map(c =>
          updateCategory(c.id, { budgetLimit: budgets[c.id] ? parseFloat(budgets[c.id]) : null })
        )
      )
      showToast('Budgets saved')
    } catch { showToast('Save failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Card title="Category Budgets" desc="Set monthly spending limits per category. Leave blank for no limit.">
      <div className="space-y-3 mb-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: cat.color + '22' }}>
              {cat.icon}
            </div>
            <span className="text-sm text-foreground w-36 shrink-0 truncate">{cat.name}</span>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                {CURRENCIES.find(c => c.code === currency)?.symbol ?? '$'}
              </span>
              <Input
                type="number"
                min="0"
                placeholder="No limit"
                className="pl-7"
                value={budgets[cat.id] ?? ''}
                onChange={e => setBudgets(p => ({ ...p, [cat.id]: e.target.value }))}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-border pt-4 mb-5">
        <p className="text-sm font-medium text-foreground mb-1">Alert Threshold</p>
        <p className="text-xs text-muted-foreground mb-3">Get notified when spending reaches this percentage of a budget.</p>
        <div className="flex items-center gap-3">
          <input
            type="range" min="50" max="100" step="5" value={threshold}
            onChange={e => setThreshold(parseInt(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-semibold text-foreground w-12 text-right">{threshold}%</span>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>50%</span><span>75%</span><span>100%</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>Save Budgets</Button>
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════
   TAB: Data & Privacy
══════════════════════════════════════════ */
function DataTab({ showToast, showDeleteConfirm, setShowDeleteConfirm, logout, navigate }) {
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try { await exportCSV({}) } catch { showToast('Export failed', 'error') }
    finally { setExporting(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      logout()
      navigate('/login')
    } catch { showToast('Delete failed', 'error'); setDeleting(false) }
  }

  return (
    <div className="space-y-4">
      <Card title="Export Your Data" desc="Download all your expense records as a CSV file.">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Export all expenses</p>
              <p className="text-xs text-muted-foreground">Downloads as a CSV file</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleExport} loading={exporting}>
            <Download size={13} /> Export CSV
          </Button>
        </div>
      </Card>

      <Card title="Danger Zone" desc="Permanent actions that cannot be undone.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 size={16} className="text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              Delete Account
            </Button>
          </div>

          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-destructive/20"
              >
                <p className="text-sm text-foreground mb-3">
                  Are you absolutely sure? This will permanently delete your account,
                  all expenses, categories, and cannot be recovered.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" loading={deleting} onClick={handleDelete}>
                    Yes, delete everything
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  )
}

/* ── Shared sub-components ── */
function Card({ title, desc, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon size={11} />}{label}
      </label>
      {children}
    </div>
  )
}

function Err({ children }) {
  return <p className="text-xs text-destructive">{children}</p>
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'w-10 h-5 rounded-full relative transition-colors',
        checked ? 'bg-primary' : 'bg-border'
      )}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  )
}

const PasswordInput = ({ show, onToggle, error, ...props }) => (
  <div className="relative">
    <Input type={show ? 'text' : 'password'} error={error} className="pr-10" {...props} />
    <button type="button" onClick={onToggle} tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  </div>
)
