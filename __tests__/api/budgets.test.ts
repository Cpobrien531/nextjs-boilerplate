import { GET, POST } from '@/app/api/budgets/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    budget: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    expense: {
      groupBy: jest.fn(),
    },
    category: {
      upsert: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock lib/api
jest.mock('@/lib/api', () => ({
  apiResponse: jest.fn((data, status = 200) => ({ data, status })),
  apiError: jest.fn((message, status = 400) => ({ error: message, status })),
  handleApiError: jest.fn((error) => ({ error: 'Internal server error', status: 500 })),
}))

import { apiResponse, apiError } from '@/lib/api'

const mockApiResponse = apiResponse as jest.Mock
const mockApiError = apiError as jest.Mock

describe('/api/budgets', () => {
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET', () => {
    it('should return budgets with spending for authenticated user', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          month: 4,
          year: 2024,
          budgetAmount: 500,
          category: { categoryName: 'Food' },
        },
      ]
      const mockSpending = [
        { categoryId: 1, _sum: { amount: 200 } },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.groupBy as jest.Mock).mockResolvedValue(mockSpending)

      const request = new Request('http://localhost:3000/api/budgets?month=4&year=2024')
      const response = await GET(request)

      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: { userId: 1, month: 4, year: 2024 },
        include: { category: true },
      })

      expect(mockApiResponse).toHaveBeenCalledWith([
        {
          budgetId: 1,
          categoryId: 1,
          categoryName: 'Food',
          month: 4,
          year: 2024,
          budgetAmount: 500,
          amountSpent: 200,
        },
      ])
    })

    it('should use current month/year when not provided', async () => {
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.expense.groupBy as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/budgets')
      await GET(request)

      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: { userId: 1, month: currentMonth, year: currentYear },
        include: { category: true },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/budgets')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })

  describe('POST', () => {
    it('should create new budget successfully', async () => {
      const mockCategory = { categoryId: 1, categoryName: 'Food' }
      const mockBudget = {
        budgetId: 1,
        categoryId: 1,
        month: 4,
        year: 2024,
        budgetAmount: 500,
        category: mockCategory,
      }

      ;(prisma.category.upsert as jest.Mock).mockResolvedValue(mockCategory)
      ;(prisma.budget.upsert as jest.Mock).mockResolvedValue(mockBudget)

      const request = new Request('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          categoryName: 'Food',
          month: 4,
          year: 2024,
          budgetAmount: 500,
        }),
      })
      const response = await POST(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        budgetId: 1,
        categoryId: 1,
        categoryName: 'Food',
        month: 4,
        year: 2024,
        budgetAmount: 500,
      }, 201)
      expect(prisma.category.upsert).toHaveBeenCalledWith({
        where: { categoryName: 'Food' },
        update: {},
        create: { categoryName: 'Food' },
      })
      expect(prisma.budget.upsert).toHaveBeenCalledWith({
        where: {
          userId_categoryId_month_year: {
            userId: 1,
            categoryId: 1,
            month: 4,
            year: 2024,
          },
        },
        update: { budgetAmount: 500 },
        create: {
          userId: 1,
          categoryId: 1,
          month: 4,
          year: 2024,
          budgetAmount: 500,
        },
        include: { category: true },
      })
    })

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ categoryName: 'Food' }),
      })
      const response = await POST(request)

      expect(mockApiError).toHaveBeenCalledWith('categoryName, month, year, and budgetAmount are required', 400)
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          categoryName: 'Food',
          month: 4,
          year: 2024,
          budgetAmount: 500,
        }),
      })
      const response = await POST(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })
})