import {
  registerSchema,
  loginSchema,
  expenseSchema,
  categorySchema,
  tagSchema,
  type RegisterInput,
  type LoginInput,
  type ExpenseInput,
  type CategoryInput,
  type TagInput,
} from '@/lib/validations'

describe('Validation schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid register input', () => {
      const validInput: RegisterInput = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password123',
      }

      const result = registerSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'invalid-email',
        name: 'John Doe',
        password: 'password123',
      }

      const result = registerSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const invalidInput = {
        email: 'test@example.com',
        name: 'A',
        password: 'password123',
      }

      const result = registerSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidInput = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'short',
      }

      const result = registerSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login input', () => {
      const validInput: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = loginSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'invalid-email',
        password: 'password123',
      }

      const result = loginSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: '',
      }

      const result = loginSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('expenseSchema', () => {
    it('should validate valid expense input', () => {
      const validInput: ExpenseInput = {
        name: 'Lunch',
        amount: 25.50,
        expenseDate: '2024-01-15T12:00:00Z',
        categoryId: '1',
      }

      const result = expenseSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalidInput = {
        name: '',
        amount: 25.50,
        expenseDate: '2024-01-15T12:00:00Z',
        categoryId: '1',
      }

      const result = expenseSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const invalidInput = {
        name: 'Lunch',
        amount: -10,
        expenseDate: '2024-01-15T12:00:00Z',
        categoryId: '1',
      }

      const result = expenseSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject invalid date', () => {
      const invalidInput = {
        name: 'Lunch',
        amount: 25.50,
        expenseDate: 'invalid-date',
        categoryId: '1',
      }

      const result = expenseSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('categorySchema', () => {
    it('should validate valid category input', () => {
      const validInput: CategoryInput = {
        name: 'Food',
        color: '#FF5733',
        monthlyBudget: 500,
      }

      const result = categorySchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalidInput = {
        name: '',
        color: '#FF5733',
        monthlyBudget: 500,
      }

      const result = categorySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject invalid color format', () => {
      const invalidInput = {
        name: 'Food',
        color: 'red',
        monthlyBudget: 500,
      }

      const result = categorySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject negative budget', () => {
      const invalidInput = {
        name: 'Food',
        color: '#FF5733',
        monthlyBudget: -100,
      }

      const result = categorySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('tagSchema', () => {
    it('should validate valid tag input', () => {
      const validInput: TagInput = {
        name: 'urgent',
        color: '#FF0000',
      }

      const result = tagSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalidInput = {
        name: '',
        color: '#FF0000',
      }

      const result = tagSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject name too long', () => {
      const invalidInput = {
        name: 'a'.repeat(51),
        color: '#FF0000',
      }

      const result = tagSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject invalid color format', () => {
      const invalidInput = {
        name: 'urgent',
        color: 'invalid',
      }

      const result = tagSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })
})