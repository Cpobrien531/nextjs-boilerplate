import { GET, POST } from '@/app/api/expenses/route';
import { prisma } from '@/lib/db';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    category: {
      upsert: jest.fn(),
    },
    tag: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    expenseTag: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock lib/api
jest.mock('@/lib/api', () => ({
  apiResponse: jest.fn((data, status = 200) => ({ data, status })),
  apiError: jest.fn((message, status = 400) => ({ error: message, status })),
  handleApiError: jest.fn((error) => ({ error: 'Internal server error', status: 500 })),
}));

import { getServerSession } from 'next-auth';
import { apiResponse, apiError } from '@/lib/api';

const mockGetServerSession = getServerSession as jest.Mock;
const mockApiResponse = apiResponse as jest.Mock;
const mockApiError = apiError as jest.Mock;

describe('/api/expenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return expenses for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1' },
      });

      const mockExpenses = [
        {
          expenseId: 1,
          amount: 100,
          vendorName: 'Test Vendor',
          expenseDate: new Date('2026-03-19'),
          category: { categoryName: 'Food' },
          tags: [{ tag: { tagName: 'lunch' } }],
        },
      ];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      const response = await GET();

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: { expenseDate: 'desc' },
      });

      expect(mockApiResponse).toHaveBeenCalledWith([
        {
          id: '1',
          amount: 100,
          description: 'Test Vendor',
          category: 'Food',
          date: '2026-03-19',
          tags: ['lunch'],
        },
      ]);
    });
  });

  describe('POST', () => {
    it('should return 401 if no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/expenses', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should create expense successfully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1' },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ userId: 1 });
      (prisma.category.upsert as jest.Mock).mockResolvedValue({ categoryId: 1 });
      (prisma.expense.create as jest.Mock).mockResolvedValue({
        expenseId: 1,
        userId: 1,
        vendorName: 'Test Expense',
        amount: 50,
        expenseDate: new Date('2026-03-19'),
        categoryId: 1,
      });
      (prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.tag.create as jest.Mock).mockResolvedValue({ tagId: 1, tagName: 'test' });

      const request = new Request('http://localhost/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amount: 50,
          description: 'Test Expense',
          category: 'Food',
          date: '2026-03-19',
          tags: ['test'],
        }),
      });

      const response = await POST(request);

      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          vendorName: 'Test Expense',
          amount: 50,
          expenseDate: new Date('2026-03-19'),
          categoryId: 1,
        },
      });

      expect(mockApiResponse).toHaveBeenCalledWith({ id: '1' }, 201);
    });
  });
});