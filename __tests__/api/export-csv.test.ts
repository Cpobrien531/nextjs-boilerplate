import { GET } from '@/app/api/export/csv/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    expense: {
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

import { apiError } from '@/lib/api'

const mockApiError = apiError as jest.Mock

describe('/api/export/csv', () => {
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET', () => {
    it('should export expenses as CSV successfully', async () => {
      const mockExpenses = [
        {
          expenseId: 1,
          expenseDate: new Date('2024-04-15'),
          vendorName: 'Restaurant',
          amount: 50,
          description: 'Lunch',
          isBillable: false,
          category: { categoryName: 'Food & Dining' },
          tags: [
            { tagId: 1, tag: { tagName: 'Lunch' } },
            { tagId: 2, tag: { tagName: 'Business' } },
          ],
        },
        {
          expenseId: 2,
          expenseDate: new Date('2024-04-20'),
          vendorName: 'Gas Station',
          amount: 30,
          description: null,
          isBillable: true,
          category: { categoryName: 'Transportation' },
          tags: [],
        },
      ]

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.export.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost:3000/api/export/csv?startDate=2024-04-01&endDate=2024-04-30')
      const response = await GET(request)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="expenses_2024-04-01_to_2024-04-30.csv"')

      const csvText = await response.text()
      const expectedCsv = `Date,Vendor,Category,Amount,Tags,Description,Billable
2024-04-15,"Restaurant","Food & Dining",50.00,"Lunch, Business","Lunch",No
2024-04-20,"Gas Station","Transportation",30.00,"","",Yes`

      expect(csvText).toBe(expectedCsv)
      expect(prisma.export.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          exportFormat: 'csv',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-04-30'),
        },
      })
    })

    it('should filter by categoryId when provided', async () => {
      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.export.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost:3000/api/export/csv?startDate=2024-04-01&endDate=2024-04-30&categoryId=1')
      await GET(request)

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          expenseDate: {
            gte: new Date('2024-04-01'),
            lte: new Date('2024-04-30'),
          },
          categoryId: 1,
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: { expenseDate: 'asc' },
      })
    })

    it('should filter by tagId when provided', async () => {
      const mockExpenses = [
        {
          expenseId: 1,
          expenseDate: new Date('2024-04-15'),
          vendorName: 'Restaurant',
          amount: 50,
          description: null,
          isBillable: false,
          category: { categoryName: 'Food & Dining' },
          tags: [
            { tagId: 1, tag: { tagName: 'Lunch' } },
          ],
        },
        {
          expenseId: 2,
          expenseDate: new Date('2024-04-20'),
          vendorName: 'Gas Station',
          amount: 30,
          description: null,
          isBillable: false,
          category: { categoryName: 'Transportation' },
          tags: [
            { tagId: 2, tag: { tagName: 'Travel' } },
          ],
        },
      ]

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.export.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost:3000/api/export/csv?startDate=2024-04-01&endDate=2024-04-30&tagId=1')
      const response = await GET(request)

      const csvText = await response.text()
      // Should only include the first expense which has tagId 1
      expect(csvText).toContain('Restaurant')
      expect(csvText).not.toContain('Gas Station')
    })

    it('should handle quotes in data properly', async () => {
      const mockExpenses = [
        {
          expenseId: 1,
          expenseDate: new Date('2024-04-15'),
          vendorName: 'Restaurant "Good Eats"',
          amount: 50,
          description: 'Meal with "quotes"',
          isBillable: false,
          category: { categoryName: 'Food & Dining' },
          tags: [],
        },
      ]

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.export.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost:3000/api/export/csv?startDate=2024-04-01&endDate=2024-04-30')
      const response = await GET(request)

      const csvText = await response.text()
      expect(csvText).toContain('"Restaurant ""Good Eats"""')
      expect(csvText).toContain('"Meal with ""quotes"""')
    })

    it('should return 400 for missing startDate or endDate', async () => {
      const request = new Request('http://localhost:3000/api/export/csv?startDate=2024-04-01')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('startDate and endDate are required', 400)
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/export/csv?startDate=2024-04-01&endDate=2024-04-30')
      const response = await GET(request)

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })
})