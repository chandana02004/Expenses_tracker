import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#f97316', icon: '🍔' },
  { name: 'Transport',     color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping',      color: '#ec4899', icon: '🛍️' },
  { name: 'Health',        color: '#22c55e', icon: '💊' },
  { name: 'Entertainment', color: '#a855f7', icon: '🎬' },
  { name: 'Housing',       color: '#eab308', icon: '🏠' },
  { name: 'Travel',        color: '#06b6d4', icon: '✈️' },
  { name: 'Other',         color: '#6b7280', icon: '📦' },
]

const USER_SELECT = {
  id: true, email: true, name: true, currency: true,
  phone: true, occupation: true, monthlyIncome: true,
  salaryDate: true, financialYearStart: true,
  alertThreshold: true, language: true, notifications: true,
  lastLoginAt: true, createdAt: true,
}

export async function registerUser({ email, name, password }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const err = new Error('Email already registered')
    err.status = 409
    throw err
  }
  const passwordHash = await bcrypt.hash(password, 12)
  return prisma.user.create({
    data: { email, name, passwordHash, categories: { create: DEFAULT_CATEGORIES } },
    select: USER_SELECT,
  })
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { const e = new Error('Invalid email or password'); e.status = 401; throw e }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) { const e = new Error('Invalid email or password'); e.status = 401; throw e }

  // stamp last login
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

export async function getUserById(id) {
  const u = await prisma.user.findUnique({ where: { id }, select: USER_SELECT })
  if (!u) return null
  return { ...u, monthlyIncome: u.monthlyIncome ? Number(u.monthlyIncome) : null }
}

export async function updateUser(id, data) {
  const u = await prisma.user.update({ where: { id }, data, select: USER_SELECT })
  return { ...u, monthlyIncome: u.monthlyIncome ? Number(u.monthlyIncome) : null }
}

export async function changePassword(id, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id } })
  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) { const e = new Error('Current password is incorrect'); e.status = 400; throw e }
  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })
}

export async function deleteUser(id) {
  await prisma.user.delete({ where: { id } })
}
