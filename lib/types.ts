export type User = {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type Category = {
  categoryId: string | number
  categoryName: string
  categoryDescription?: string | null
}

export type Tag = {
  tagId: string | number
  userId: number
  tagName: string
  tagType: string
}

export type Expense = {
  expenseId: string | number
  userId: number
  categoryId: number
  vendorName: string
  description?: string | null
  amount: number
  expenseDate: Date
  isBillable: boolean
  createdTimestamp: Date
  lastModifiedTimestamp: Date
}

export type ExpenseWithRelations = Expense & {
  category: Category
  tags: Tag[]
}

export type UserSettings = {
  budgetAlertThreshold: number
}
