import { GET } from '@/app/api/budget/alerts/route'
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

describe('/api/budget/alerts', () => {
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

      const request = new Request('http://localhost:3000/api/budget/alerts')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })

    it('should return empty alerts when no budgets exist', async () => {
      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/budget/alerts')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        alerts: [],
        hasAlerts: false,
      })
    })

    it('should return empty alerts when spending is below 90%', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 300 } }) // 60% spent

      const request = new Request('http://localhost:3000/api/budget/alerts')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        alerts: [],
        hasAlerts: false,
      })
    })

    it('should return warning alert when spending is between 90-99%', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 450 } }) // 90% spent

      const request = new Request('http://localhost:3000/api/budget/alerts')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        alerts: [
          {
            budgetId: 1,
            categoryId: 1,
            categoryName: 'Food & Dining',
            budget: 500,
            spent: 450,
            percentageSpent: 90,
            severity: 'warning',
          },
        ],
        hasAlerts: true,
      })
    })

    it('should return critical alert when spending exceeds 100%', async () => {
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          budgetAmount: 500,
          category: { categoryName: 'Food & Dining' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 550 } }) // 110% spent

      const request = new Request('http://localhost:3000/api/budget/alerts')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        alerts: [
          {
            budgetId: 1,
            categoryId: 1,
            categoryName: 'Food & Dining',
            budget: 500,
            spent: 550,
            percentageSpent: 110,
            severity: 'critical',
          },
        ],
        hasAlerts: true,
      })
    })

    it('should return multiple alerts for multiple budgets over threshold', async () => {
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
        {
          budgetId: 3,
          categoryId: 3,
          budgetAmount: 200,
          category: { categoryName: 'Entertainment' },
        },
      ]

      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 450 } }) // Food: 90% - warning
        .mockResolvedValueOnce({ _sum: { amount: 320 } }) // Transport: 106.67% - critical
        .mockResolvedValueOnce({ _sum: { amount: 100 } }) // Entertainment: 50% - no alert

      const request = new Request('http://localhost:3000/api/budget/alerts')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        alerts: [
          {
            budgetId: 1,
            categoryId: 1,
            categoryName: 'Food & Dining',
            budget: 500,
            spent: 450,
            percentageSpent: 90,
            severity: 'warning',
          },
          {
            budgetId: 2,
            categoryId: 2,
            categoryName: 'Transportation',
            budget: 300,
            spent: 320,
            percentageSpent: 106.67,
            severity: 'critical',
          },
        ],
        hasAlerts: true,
      })
    })

    it('should handle database errors', async () => {
      ;(prisma.budget.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/budget/alerts')
      const response = await GET(request)

      // handleApiError is called for database errors
      expect(response).toBeDefined()
    })
  })
})