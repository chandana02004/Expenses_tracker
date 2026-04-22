import { motion } from 'framer-motion'
import { TrendingDown } from 'lucide-react'

const floatVariant = {
  animate: (i) => ({
    y: [0, -8, 0],
    transition: { duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
  }),
}

const cards = [
  { label: 'Food & Dining', amount: '$284', pct: 71, color: '#f97316', icon: '🍔', pos: 'top-[10%] left-[6%]', i: 0 },
  { label: 'Shopping',      amount: '$520', pct: 86, color: '#a855f7', icon: '🛍️', pos: 'top-[36%] right-[4%]', i: 1 },
  { label: 'Transport',     amount: '$96',  pct: 40, color: '#3b82f6', icon: '🚗', pos: 'bottom-[26%] left-[4%]', i: 2 },
  { label: 'Travel',        amount: '$1,200', pct: 95, color: '#06b6d4', icon: '✈️', pos: 'bottom-[8%] right-[8%]', i: 3 },
]

const barData = [40, 65, 50, 80, 60, 90, 72]
const months  = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr']

export default function AuthPanel() {
  return (
    <div className="hidden lg:flex flex-col flex-1 relative bg-secondary/30 border-l border-border overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_30%,hsl(263,70%,65%,0.12),transparent_70%)] pointer-events-none" />

      {cards.map(({ label, amount, pct, color, icon, pos, i }) => (
        <motion.div
          key={label}
          custom={i}
          variants={floatVariant}
          animate="animate"
          className={`absolute ${pos} bg-card border border-border rounded-xl px-3 py-2.5 w-44 shadow-xl`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
                <span className="text-[11px]">{icon}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
            </div>
            <span className="text-[11px] font-semibold text-foreground">{amount}</span>
          </div>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
            />
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-medium">This month</p>
        <p className="text-5xl font-bold text-foreground tracking-tight">$2,100</p>
        <div className="flex items-center gap-1.5 mt-2">
          <TrendingDown size={13} className="text-emerald-500" />
          <span className="text-xs text-emerald-500 font-medium">12% less than last month</span>
        </div>
        <div className="flex items-end gap-2 mt-8">
          {barData.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                className="w-5 rounded-sm"
                style={{ backgroundColor: i === 6 ? 'hsl(263,70%,65%)' : 'hsl(var(--border))', height: `${h * 0.55}px` }}
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
              />
              <span className="text-[9px] text-muted-foreground">{months[i]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">Know exactly where your money goes.</p>
      </div>
    </div>
  )
}
