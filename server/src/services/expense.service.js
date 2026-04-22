import { PrismaClient } from '@prisma/client'
import { Parser } from 'json2csv'

const prisma = new PrismaClient()

const CATEGORY_SELECT = { name: true, color: true, icon: true }

function toNum(e) {
  return { ...e, amount: Number(e.amount) }
}

export async function listExpenses(userId, query) {
  const {
    search, categoryId, startDate, endDate,
    paymentMethod, sort = 'newest', page = 1, limit = 15,
  } = query

  const where = { userId }
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { notes:       { contains: search, mode: 'insensitive' } },
    ]
  }
  if (categoryId)    where.categoryId    = categoryId
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate)   where.date.lte = new Date(endDate + 'T23:59:59')
  }

  const orderBy = {
    newest:  { date:   'desc' },
    oldest:  { date:   'asc'  },
    highest: { amount: 'desc' },
    lowest:  { amount: 'asc'  },
  }[sort] ?? { date: 'desc' }

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ where, orderBy, skip, take: parseInt(limit), include: { category: { select: CATEGORY_SELECT } } }),
    prisma.expense.count({ where }),
  ])

  return { expenses: expenses.map(toNum), total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }
}

export async function createExpense(userId, data) {
  const e = await prisma.expense.create({
    data: { ...data, userId, date: new Date(data.date) },
    include: { category: { select: CATEGORY_SELECT } },
  })
  return toNum(e)
}

export async function updateExpense(userId, id, data) {
  const expense = await prisma.expense.findFirst({ where: { id, userId } })
  if (!expense) { const e = new Error('Not found'); e.status = 404; throw e }
  const updated = await prisma.expense.update({
    where: { id },
    data: { ...data, ...(data.date && { date: new Date(data.date) }) },
    include: { category: { select: CATEGORY_SELECT } },
  })
  return toNum(updated)
}

export async function deleteExpense(userId, id) {
  const expense = await prisma.expense.findFirst({ where: { id, userId } })
  if (!expense) { const e = new Error('Not found'); e.status = 404; throw e }
  await prisma.expense.delete({ where: { id } })
}

export async function exportExpensesCSV(userId, query) {
  const { expenses } = await listExpenses(userId, { ...query, limit: 10000 })
  const fields = ['date', 'description', 'amount', 'category.name', 'paymentMethod', 'notes']
  const data = expenses.map(e => ({
    date: new Date(e.date).toLocaleDateString(),
    description: e.description ?? '',
    amount: e.amount,
    'category.name': e.category.name,
    paymentMethod: e.paymentMethod,
    notes: e.notes ?? '',
  }))
  const parser = new Parser({ fields })
  return parser.parse(data)
}

/* Recurring */
export async function listRecurring(userId) {
  const r = await prisma.recurringExpense.findMany({
    where: { userId },
    include: { category: { select: CATEGORY_SELECT } },
    orderBy: { createdAt: 'asc' },
  })
  return r.map(e => ({ ...e, amount: Number(e.amount) }))
}

export async function createRecurring(userId, data) {
  const r = await prisma.recurringExpense.create({
    data: { ...data, userId },
    include: { category: { select: CATEGORY_SELECT } },
  })
  return { ...r, amount: Number(r.amount) }
}

export async function updateRecurring(userId, id, data) {
  const r = await prisma.recurringExpense.findFirst({ where: { id, userId } })
  if (!r) { const e = new Error('Not found'); e.status = 404; throw e }
  const updated = await prisma.recurringExpense.update({ where: { id }, data, include: { category: { select: CATEGORY_SELECT } } })
  return { ...updated, amount: Number(updated.amount) }
}

export async function deleteRecurring(userId, id) {
  const r = await prisma.recurringExpense.findFirst({ where: { id, userId } })
  if (!r) { const e = new Error('Not found'); e.status = 404; throw e }
  await prisma.recurringExpense.delete({ where: { id } })
}

export async function applyRecurring(userId, id) {
  const r = await prisma.recurringExpense.findFirst({ where: { id, userId } })
  if (!r) { const e = new Error('Not found'); e.status = 404; throw e }
  const expense = await prisma.expense.create({
    data: {
      amount: r.amount,
      description: r.title,
      date: new Date(),
      paymentMethod: r.paymentMethod,
      notes: r.notes,
      categoryId: r.categoryId,
      userId,
    },
    include: { category: { select: CATEGORY_SELECT } },
  })
  return toNum(expense)
}
