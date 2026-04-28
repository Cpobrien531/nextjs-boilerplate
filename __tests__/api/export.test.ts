import { GET } from '@/app/api/export/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    export: {
      create: jest.fn(),
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

describe('/api/export', () => {
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1', name: 'Test User' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET', () => {
    it('should export expenses and budgets data successfully', async () => {
      const mockExpenses = [
        {
          expenseId: 1,
          expenseDate: new Date('2024-04-15'),
          vendorName: 'Restaurant',
          amount: 50,
          category: { categoryName: 'Food & Dining' },
        },
        {
          expenseId: 2,
          expenseDate: new Date('2024-04-20'),
          vendorName: 'Gas Station',
          amount: 30,
          category: { categoryName: 'Transportation' },
        },
      ]
      const mockBudgets = [
        {
          budgetId: 1,
          categoryId: 1,
          month: 4,
          year: 2024,
          budgetAmount: 200,
          category: { categoryName: 'Food & Dining' },
        },
      ]
      const mockSpending = [
        { categoryId: 1, _sum: { amount: 150 } },
        { categoryId: 2, _sum: { amount: 30 } },
      ]

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets)
      ;(prisma.expense.groupBy as jest.Mock).mockResolvedValue(mockSpending)
      ;(prisma.export.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost:3000/api/export?startDate=2024-04-01&endDate=2024-04-30')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        userName: 'Test User',
        startDate: '2024-04-01',
        endDate: '2024-04-30',
        expenses: [
          {
            date: '2024-04-15',
            vendor: 'Restaurant',
            category: 'Food & Dining',
            amount: 50,
          },
          {
            date: '2024-04-20',
            vendor: 'Gas Station',
            category: 'Transportation',
            amount: 30,
          },
        ],
        budgetSummary: [
          {
            categoryName: 'Food & Dining',
            month: 4,
            year: 2024,
            budgetAmount: 200,
            amountSpent: 150,
          },
        ],
      })
      expect(prisma.export.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          exportFormat: 'pdf',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-04-30'),
        },
      })
    })

    it('should return 400 for missing startDate or endDate', async () => {
      const request = new Request('http://localhost:3000/api/export?startDate=2024-04-01')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('startDate and endDate are required', 400)
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/export?startDate=2024-04-01&endDate=2024-04-30')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })
})