import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const expenseSchema = z.object({
  name: z.string().min(1, 'Expense name is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  expenseDate: z.string().datetime(),
  categoryId: z.string(),
  location: z.string().optional(),
  isBillable: z.boolean().default(false),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  monthlyBudget: z.number().nonnegative('Budget must be non-negative'),
})

export const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type TagInput = z.infer<typeof tagSchema>
