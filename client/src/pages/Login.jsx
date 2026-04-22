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
import AuthPanel from '@/components/layout/AuthPanel'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Login() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login(data)
    } catch (err) {
      setServerError(err.response?.data?.error || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — form */}
      <div className="flex flex-col justify-center w-full lg:w-[45%] px-8 sm:px-14 xl:px-20">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-14"
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to pick up where you left off.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Server error */}
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
                  placeholder="••••••••"
                  error={errors.password}
                  className="pr-10"
                  {...register('password')}
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
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </motion.div>

            <motion.div variants={item}>
              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Sign in
              </Button>
            </motion.div>
          </form>

          <motion.p variants={item} className="text-xs text-muted-foreground text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create one free
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right — visual panel */}
      <AuthPanel />
    </div>
  )
}
