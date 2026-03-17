import { ExpenseStatus } from '@prisma/client'

export type User = {
  id: string
  email: string
  name: string
  budgetAlertThreshold: number
  createdAt: Date
  updatedAt: Date
}

export type Category = {
  id: string
  userId: string
  name: string
  icon?: string | null
  color: string
  monthlyBudget: number
  currentMonthSpent: number
  createdAt: Date
}

export type Tag = {
  id: string
  userId: string
  name: string
  color: string
  createdAt: Date
}

export type Expense = {
  id: string
  userId: string
  categoryId: string
  name: string
  description?: string | null
  amount: number
  expenseDate: Date
  location?: string | null
  receiptImageURL?: string | null
  receiptImagePath?: string | null
  isBillable: boolean
  status: ExpenseStatus
  createdAt: Date
  lastModifiedDate: Date
}

export type ExpenseWithRelations = Expense & {
  category: Category
  tags: Tag[]
}

export type UserSettings = {
  budgetAlertThreshold: number
}
