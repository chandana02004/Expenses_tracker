import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#f97316', icon: '🍔' },
  { name: 'Transport', color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping', color: '#ec4899', icon: '🛍️' },
  { name: 'Health', color: '#22c55e', icon: '💊' },
  { name: 'Entertainment', color: '#a855f7', icon: '🎬' },
  { name: 'Housing', color: '#eab308', icon: '🏠' },
  { name: 'Travel', color: '#06b6d4', icon: '✈️' },
  { name: 'Other', color: '#6b7280', icon: '📦' },
]

async function main() {
  console.log('Seed file ready — categories are seeded per user on registration.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
