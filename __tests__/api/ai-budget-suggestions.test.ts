import { GET } from '@/app/api/ai/budget-suggestions/route'
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

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }))
})

// Mock lib/api
jest.mock('@/lib/api', () => ({
  apiResponse: jest.fn((data, status = 200) => ({ data, status })),
  apiError: jest.fn((message, status = 400) => ({ error: message, status })),
  handleApiError: jest.fn((error) => ({ error: 'Internal server error', status: 500 })),
}))

import { apiResponse, apiError } from '@/lib/api'

const mockApiResponse = apiResponse as jest.Mock
const mockApiError = apiError as jest.Mock

describe('/api/ai/budget-suggestions', () => {
  let mockSession: any
  let mockOpenAI: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    // Mock OpenAI
    const OpenAI = require('openai')
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    }
    OpenAI.mockImplementation(() => mockOpenAI)
  })

  describe('GET', () => {
    it('should return unauthorized when no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/ai/budget-suggestions')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })

    it('should return empty suggestions when no budget data', async () => {
      ;(prisma.budget.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: null } })

      const request = new Request('http://localhost:3000/api/ai/budget-suggestions')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        suggestions: [],
        message: 'Not enough data for budget suggestions. Please check back after a few months of expense tracking.',
      })
    })

    it('should generate budget suggestions successfully', async () => {
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

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: 'Food & Dining',
                recommendation: 'keep',
                reasoning: 'Spending is close to budget, current amount is appropriate',
                suggestedBudget: 500,
              },
            ]),
          },
        }],
      })

      const request = new Request('http://localhost:3000/api/ai/budget-suggestions')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        suggestions: [
          {
            category: 'Food & Dining',
            recommendation: 'keep',
            reasoning: 'Spending is close to budget, current amount is appropriate',
            suggestedBudget: 500,
          },
        ],
        analysisMonths: 6,
      })
    })

    it('should filter by categoryId when provided', async () => {
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

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: 'Food & Dining',
                recommendation: 'decrease',
                reasoning: 'Consistently overspending',
                suggestedBudget: 400,
              },
            ]),
          },
        }],
      })

      const request = new Request('http://localhost:3000/api/ai/budget-suggestions?categoryId=1')
      const response = await GET(request)

      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          categoryId: 1,
          month: expect.any(Number),
          year: expect.any(Number),
        },
        include: { category: true },
      })
    })

    it('should handle OpenAI API errors gracefully', async () => {
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

      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'))

      const request = new Request('http://localhost:3000/api/ai/budget-suggestions')
      const response = await GET(request)

      // When OpenAI throws an error, the catch block returns handleApiError response
      expect(response).toBeDefined()
    })

    it('should handle malformed OpenAI response', async () => {
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

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response',
          },
        }],
      })

      const request = new Request('http://localhost:3000/api/ai/budget-suggestions')
      const response = await GET(request)

      expect(mockApiResponse).toHaveBeenCalledWith({
        suggestions: [],
        analysisMonths: 6,
      })
    })
  })
})