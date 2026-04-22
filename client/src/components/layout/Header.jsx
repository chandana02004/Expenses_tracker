import { useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import useStore from '@/store/useStore'

export default function Header({ onMenuClick }) {
  const { user, theme, toggleTheme, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Centre: brand on mobile when sidebar is hidden */}
      <span className="lg:hidden text-sm font-semibold text-foreground">Spendwise</span>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      {/* Right: theme toggle + user info + logout */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </motion.div>
        </motion.button>

        {/* User badge — hidden on smallest screens */}
        {user && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-primary">
                {user.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground hidden md:block">
              {user.name}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
