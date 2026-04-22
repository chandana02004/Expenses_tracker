import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)
  return { start, end }
}

function prevMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function getDashboardData(userId, month) {
  const { start, end } = monthRange(month)
  const prev = prevMonth(month)
  const { start: prevStart, end: prevEnd } = monthRange(prev)

  // Current & previous month totals
  const [curAgg, prevAgg] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: prevStart, lt: prevEnd } },
      _sum: { amount: true },
    }),
  ])

  const totalExpenses = Number(curAgg._sum.amount ?? 0)
  const prevTotal = Number(prevAgg._sum.amount ?? 0)
  const expenseChange =
    prevTotal === 0 ? 0 : Math.round(((totalExpenses - prevTotal) / prevTotal) * 100)

  // By category (current month)
  const categories = await prisma.category.findMany({
    where: { userId },
    include: {
      expenses: {
        where: { date: { gte: start, lt: end } },
        select: { amount: true },
      },
    },
  })

  const byCategory = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : null,
      spent: c.expenses.reduce((s, e) => s + Number(e.amount), 0),
    }))
    .filter((c) => c.spent > 0 || c.budgetLimit)
    .sort((a, b) => b.spent - a.spent)

  const budgetTotal = byCategory.reduce((s, c) => s + (c.budgetLimit ?? 0), 0)
  const alerts = byCategory
    .filter((c) => c.budgetLimit && c.spent >= c.budgetLimit * 0.8)
    .map((c) => ({
      type: c.spent >= c.budgetLimit ? 'exceeded' : 'warning',
      message:
        c.spent >= c.budgetLimit
          ? `You've exceeded your ${c.name} budget`
          : `${c.name} is at ${Math.round((c.spent / c.budgetLimit) * 100)}% of budget`,
      category: c.name,
      color: c.color,
    }))

  // 7-month trend
  const monthlyTrend = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(start)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const { start: s, end: e } = monthRange(key)
    const agg = await prisma.expense.aggregate({
      where: { userId, date: { gte: s, lt: e } },
      _sum: { amount: true },
    })
    monthlyTrend.push({
      month: key,
      label: d.toLocaleDateString('en', { month: 'short' }),
      amount: Number(agg._sum.amount ?? 0),
    })
  }

  // Recent 8 expenses
  const recentExpenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 8,
    include: { category: { select: { name: true, color: true, icon: true } } },
  })

  return {
    month,
    totalExpenses,
    expenseChange,
    budgetTotal,
    budgetUsed: totalExpenses,
    byCategory,
    monthlyTrend,
    recentExpenses: recentExpenses.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      description: e.description,
      date: e.date,
      category: e.category,
    })),
    alerts,
  }
}
