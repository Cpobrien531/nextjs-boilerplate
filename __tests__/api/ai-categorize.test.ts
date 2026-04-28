import { POST } from '@/app/api/ai/categorize/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { categorizeExpense } from '@/lib/ai'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/ai', () => ({
  categorizeExpense: jest.fn(),
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

describe('/api/ai/categorize', () => {
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('POST', () => {
    it('should categorize expense successfully', async () => {
      const mockCategories = [
        { categoryId: 1, categoryName: 'Food & Dining' },
        { categoryId: 2, categoryName: 'Transportation' },
      ]

      ;(prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories)
      ;(categorizeExpense as jest.Mock).mockResolvedValue({
        category: 'Food & Dining',
        confidence: 0.95,
      })

      const request = new Request('http://localhost:3000/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify({
          expenseName: 'Lunch at Restaurant',
          description: 'Delicious meal',
        }),
      })
      const response = await POST(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        suggestedCategory: 'Food & Dining',
        categoryId: 1,
        confidence: 0.95,
      })
      expect(categorizeExpense).toHaveBeenCalledWith(
        'Lunch at Restaurant',
        'Delicious meal',
        ['Food & Dining', 'Transportation']
      )
    })

    it('should handle expense without description', async () => {
      const mockCategories = [
        { categoryId: 1, categoryName: 'Food & Dining' },
      ]

      ;(prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories)
      ;(categorizeExpense as jest.Mock).mockResolvedValue({
        category: 'Food & Dining',
        confidence: 0.8,
      })

      const request = new Request('http://localhost:3000/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify({
          expenseName: 'Grocery Shopping',
        }),
      })
      const response = await POST(request)

      expect(categorizeExpense).toHaveBeenCalledWith(
        'Grocery Shopping',
        undefined,
        ['Food & Dining']
      )
    })

    it('should return 400 for missing expense name', async () => {
      const request = new Request('http://localhost:3000/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Some description',
        }),
      })
      const response = await POST(request)

      expect(mockApiError).toHaveBeenCalledWith('Expense name is required', 400)
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify({
          expenseName: 'Test Expense',
        }),
      })
      const response = await POST(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })
})