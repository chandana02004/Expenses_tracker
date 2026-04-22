import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, TrendingDown, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import useStore from '@/store/useStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PasswordStrength from '@/components/ui/PasswordStrength'
import AuthPanel from '@/components/layout/AuthPanel'

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Register() {
  const { register: registerUser } = useAuth()
  const { theme, toggleTheme } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ name, email, password }) => {
    setServerError('')
    try {
      await registerUser({ name, email, password })
    } catch (err) {
      setServerError(err.response?.data?.error || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — form */}
      <div className="flex flex-col justify-center w-full lg:w-[45%] px-8 sm:px-14 xl:px-20 overflow-y-auto py-10">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <TrendingDown size={15} className="text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-wide">Spendwise</span>
          </div>
          <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="max-w-sm w-full">
          {/* Heading */}
          <motion.div variants={item} className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create account</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Start tracking your expenses in seconds.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3"
              >
                <p className="text-xs text-destructive">{serverError}</p>
              </motion.div>
            )}

            <motion.div variants={item} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Full name
              </label>
              <Input
                placeholder="Jane Smith"
                error={errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </motion.div>

            <motion.div variants={item} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                error={errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </motion.div>

            <motion.div variants={item} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  error={errors.password}
                  className="pr-10"
                  {...register('password', {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <PasswordStrength password={passwordValue} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </motion.div>

            <motion.div variants={item} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Confirm password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </motion.div>

            <motion.div variants={item}>
              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Create account
              </Button>
            </motion.div>
          </form>

          <motion.p variants={item} className="text-xs text-muted-foreground text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right — visual panel */}
      <AuthPanel />
    </div>
  )
}
