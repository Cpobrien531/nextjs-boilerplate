import { PUT, DELETE } from '@/app/api/expenses/[id]/route';
import { prisma } from '@/lib/db';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    expense: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      upsert: jest.fn(),
    },
    tag: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    expenseTag: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    receipt: {
      deleteMany: jest.fn(),
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
import { apiResponse, apiError, handleApiError } from '@/lib/api';

const mockGetServerSession = getServerSession as jest.Mock;
const mockApiResponse = apiResponse as jest.Mock;
const mockApiError = apiError as jest.Mock;

describe('/api/expenses/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify({ amount: 50 }),
      });

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return 404 if expense not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/expenses/999', {
        method: 'PUT',
        body: JSON.stringify({ amount: 50 }),
      });

      await PUT(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockApiError).toHaveBeenCalledWith('Expense not found', 404);
    });

    it('should return 403 if expense does not belong to user', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({ userId: 2 });

      const request = new Request('http://localhost/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify({ amount: 50 }),
      });

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockApiError).toHaveBeenCalledWith('Forbidden', 403);
    });

    it('should update expense successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({ userId: 1, categoryId: 1 });
      (prisma.category.upsert as jest.Mock).mockResolvedValue({ categoryId: 1 });
      (prisma.expense.update as jest.Mock).mockResolvedValue({ expenseId: 1, amount: 50 });
      (prisma.expenseTag.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.tag.findFirst as jest.Mock).mockResolvedValue({ tagId: 1 });
      (prisma.expenseTag.create as jest.Mock).mockResolvedValue({});

      const request = new Request('http://localhost/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify({ amount: 50, tags: ['work'] }),
      });

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { expenseId: 1 },
        data: { amount: 50 },
      });
      expect(mockApiResponse).toHaveBeenCalledWith({ expenseId: 1, amount: 50 });
    });
  });

  describe('DELETE', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/expenses/1', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return 404 if expense not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/expenses/999', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockApiError).toHaveBeenCalledWith('Expense not found', 404);
    });

    it('should delete expense successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({ userId: 1 });
      (prisma.receipt.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.expenseTag.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.expense.delete as jest.Mock).mockResolvedValue({});

      const request = new Request('http://localhost/api/expenses/1', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(prisma.expense.delete).toHaveBeenCalledWith({
        where: { expenseId: 1 },
      });
      expect(mockApiResponse).toHaveBeenCalledWith({ message: 'Expense deleted successfully' });
    });
  });
});