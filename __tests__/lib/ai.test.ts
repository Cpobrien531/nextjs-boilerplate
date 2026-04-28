// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}))

// Mock the entire ai module to avoid module-level instantiation
jest.mock('@/lib/ai', () => ({
  categorizeExpense: jest.fn(),
  generateBudgetSummary: jest.fn(),
}))

import { categorizeExpense, generateBudgetSummary } from '@/lib/ai'

const mockCategorizeExpense = categorizeExpense as jest.MockedFunction<typeof categorizeExpense>
const mockGenerateBudgetSummary = generateBudgetSummary as jest.MockedFunction<typeof generateBudgetSummary>

describe('AI functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('categorizeExpense', () => {
    it('should categorize expense with default categories', async () => {
      mockCategorizeExpense.mockResolvedValue({
        category: 'Food & Dining',
        confidence: 0.95,
      })

      const result = await categorizeExpense('Starbucks Coffee')

      expect(result).toEqual({
        category: 'Food & Dining',
        confidence: 0.95,
      })
      expect(mockCategorizeExpense).toHaveBeenCalledWith('Starbucks Coffee')
    })

    it('should categorize expense with custom categories', async () => {
      mockCategorizeExpense.mockResolvedValue({
        category: 'Beverages',
        confidence: 0.88,
      })

      const result = await categorizeExpense(
        'Starbucks Coffee',
        'Morning coffee',
        ['Beverages', 'Food', 'Transportation']
      )

      expect(result).toEqual({
        category: 'Beverages',
        confidence: 0.88,
      })
      expect(mockCategorizeExpense).toHaveBeenCalledWith(
        'Starbucks Coffee',
        'Morning coffee',
        ['Beverages', 'Food', 'Transportation']
      )
    })
  })

  describe('generateBudgetSummary', () => {
    it('should generate budget summary', async () => {
      mockGenerateBudgetSummary.mockResolvedValue(
        'Your spending shows consistent patterns in dining out. Consider meal prepping to reduce food expenses.'
      )

      const expenses = [
        { name: 'Lunch', amount: 15.50, category: 'Food & Dining' },
        { name: 'Coffee', amount: 5.00, category: 'Food & Dining' },
        { name: 'Gas', amount: 45.00, category: 'Transportation' },
      ]

      const result = await generateBudgetSummary(expenses)

      expect(result).toBe(
        'Your spending shows consistent patterns in dining out. Consider meal prepping to reduce food expenses.'
      )
      expect(mockGenerateBudgetSummary).toHaveBeenCalledWith(expenses)
    })
  })
})