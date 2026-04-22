import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function listCategories(userId) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [categories, monthlyGroups, totalGroups] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum:   { amount: true },
      _count: { id: true },
    }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId },
      _count: { id: true },
    }),
  ])

  const monthlyMap = Object.fromEntries(
    monthlyGroups.map(g => [g.categoryId, { spend: Number(g._sum.amount ?? 0), count: g._count.id }])
  )
  const totalMap = Object.fromEntries(
    totalGroups.map(g => [g.categoryId, g._count.id])
  )

  return categories.map(cat => ({
    id:            cat.id,
    name:          cat.name,
    color:         cat.color,
    icon:          cat.icon,
    budgetLimit:   cat.budgetLimit ? Number(cat.budgetLimit) : null,
    createdAt:     cat.createdAt,
    totalExpenses: totalMap[cat.id]   ?? 0,
    monthlySpend:  monthlyMap[cat.id]?.spend ?? 0,
    monthlyCount:  monthlyMap[cat.id]?.count ?? 0,
  }))
}

export async function createCategory(userId, data) {
  return prisma.category.create({ data: { ...data, userId } })
}

export async function updateCategory(userId, id, data) {
  const cat = await prisma.category.findFirst({ where: { id, userId } })
  if (!cat) { const e = new Error('Not found'); e.status = 404; throw e }
  return prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(userId, id) {
  const cat = await prisma.category.findFirst({ where: { id, userId } })
  if (!cat) { const e = new Error('Not found'); e.status = 404; throw e }
  const count = await prisma.expense.count({ where: { categoryId: id } })
  if (count > 0) {
    const e = new Error(`Cannot delete — ${count} expense${count > 1 ? 's are' : ' is'} using this category.`)
    e.status = 400
    throw e
  }
  await prisma.category.delete({ where: { id } })
}
