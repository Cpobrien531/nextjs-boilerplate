import { GET } from '@/app/api/budget/history/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    budget: {
      findMany: jest.fn(),
    },
    expense: {
      aggregate: jest.fn(),
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

describe('/api/budget/history', () => {
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET', () => {
    it('should return unauthorized when no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/budget/history')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })

    it('should return empty history when no budgets exist', async () => {
      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/budget/history')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        history: [],
      })
    })

    it('should return budget history for default 12 months', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 450 } })

      const request = new Request('http://localhost:3000/api/budget/history')
      const response = await GET(request)

      expect(prisma.budget.findMany).toHaveBeenCalledTimes(12) // 12 months
      expect(mockApiResponse).toHaveBeenCalledWith({
        history: expect.any(Array),
      })
    })

    it('should respect custom months parameter', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 450 } })

      const request = new Request('http://localhost:3000/api/budget/history?months=6')
      const response = await GET(request)

      expect(prisma.budget.findMany).toHaveBeenCalledTimes(6) // 6 months
    })

    it('should calculate budget history correctly', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
        {
          budgetId: 2,
          categoryId: 2,
          budgetAmount: 300,
          category: { categoryName: 'Transportation' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 450 } }) // Food spending
        .mockResolvedValueOnce({ _sum: { amount: 280 } }) // Transport spending

      const request = new Request('http://localhost:3000/api/budget/history?months=1')
      const response = await GET(request)

      const expectedHistory = [
        {
          month: expect.any(Number),
          year: expect.any(Number),
          monthLabel: expect.any(String),
          categories: [
            {
              categoryId: 1,
              categoryName: 'Food & Dining',
              budget: 500,
              spent: 450,
              percentage: 90,
              status: 'warning',
            },
            {
              categoryId: 2,
              categoryName: 'Transportation',
              budget: 300,
              spent: 280,
              percentage: 93.33,
              status: 'warning',
            },
          ],
          totalBudget: 800,
          totalSpent: 730,
          totalPercentage: 91.25,
        },
      ]

      expect(mockApiResponse).toHaveBeenCalledWith({
        history: expectedHistory,
      })
    })

    it('should handle over-budget categories correctly', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 600 } }) // Over budget

      const request = new Request('http://localhost:3000/api/budget/history?months=1')
      const response = await GET(request)

      const expectedHistory = [
        {
          month: expect.any(Number),
          year: expect.any(Number),
          monthLabel: expect.any(String),
          categories: [
            {
              categoryId: 1,
              categoryName: 'Food & Dining',
              budget: 500,
              spent: 600,
              percentage: 120,
              status: 'over',
            },
          ],
          totalBudget: 500,
          totalSpent: 600,
          totalPercentage: 120,
        },
      ]

      expect(mockApiResponse).toHaveBeenCalledWith({
        history: expectedHistory,
      })
    })

    it('should handle on-track categories correctly', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 350 } }) // 70% - on track

      const request = new Request('http://localhost:3000/api/budget/history?months=1')
      const response = await GET(request)

      const expectedHistory = [
        {
          month: expect.any(Number),
          year: expect.any(Number),
          monthLabel: expect.any(String),
          categories: [
            {
              categoryId: 1,
              categoryName: 'Food & Dining',
              budget: 500,
              spent: 350,
              percentage: 70,
              status: 'on-track',
            },
          ],
          totalBudget: 500,
          totalSpent: 350,
          totalPercentage: 70,
        },
      ]

      expect(mockApiResponse).toHaveBeenCalledWith({
        history: expectedHistory,
      })
    })

    it('should skip months with no budget data', async () => {
      // First month has budgets, second month doesn't
      ;(prisma.budget.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            budgetId: 1,
            categoryId: 1,
            budgetAmount: 500,
            category: { categoryName: 'Food & Dining' },
          },
        ])
        .mockResolvedValueOnce([]) // No budgets for this month

      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 450 } })

      const request = new Request('http://localhost:3000/api/budget/history?months=2')
      const response = await GET(request)

      const history = mockApiResponse.mock.calls[0][0].history
      expect(history).toHaveLength(1) // Only one month with data
    })

    it('should handle database errors', async () => {
      ;(prisma.budget.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/budget/history')
      const response = await GET(request)

      // handleApiError is called for database errors
      expect(response).toBeDefined()
    })
  })
})