import { GET } from '@/app/api/ai/summary/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { generateBudgetSummary } from '@/lib/ai'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/ai', () => ({
  generateBudgetSummary: jest.fn(),
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

describe('/api/ai/summary', () => {
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET', () => {
    it('should return expense summary for authenticated user', async () => {
      const mockExpenses = [
        {
          expenseId: 1,
          vendorName: 'Restaurant',
          amount: 50,
          expenseDate: new Date('2024-04-15'),
          category: { categoryName: 'Food & Dining' },
        },
        {
          expenseId: 2,
          vendorName: 'Gas Station',
          amount: 30,
          expenseDate: new Date('2024-04-20'),
          category: { categoryName: 'Transportation' },
        },
      ]

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(generateBudgetSummary as jest.Mock).mockResolvedValue(
        'You spent $80 total, with $50 on food and $30 on transportation. Consider reducing dining out expenses.'
      )

      const request = new Request('http://localhost:3000/api/ai/summary?month=4&year=2024')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        summary: 'You spent $80 total, with $50 on food and $30 on transportation. Consider reducing dining out expenses.',
        totalSpent: 80,
        expenses: [
          {
            name: 'Restaurant',
            amount: 50,
            category: 'Food & Dining',
          },
          {
            name: 'Gas Station',
            amount: 30,
            category: 'Transportation',
          },
        ],
      })
      expect(generateBudgetSummary).toHaveBeenCalledWith([
        {
          name: 'Restaurant',
          amount: 50,
          category: 'Food & Dining',
        },
        {
          name: 'Gas Station',
          amount: 30,
          category: 'Transportation',
        },
      ])
    })

    it('should use current month/year when not provided', async () => {
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/ai/summary')
      await GET(request)

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          expenseDate: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lte: new Date(currentYear, currentMonth, 0),
          },
        },
        include: {
          category: true,
        },
      })
    })

    it('should return default message when no expenses found', async () => {
      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/ai/summary')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        summary: 'No expenses recorded for this period.',
        totalSpent: 0,
        expenses: [],
      })
      expect(generateBudgetSummary).not.toHaveBeenCalled()
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/ai/summary')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })
})