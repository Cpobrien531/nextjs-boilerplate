import { PUT, DELETE } from '@/app/api/budgets/[id]/route';
import { prisma } from '@/lib/db';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    budget: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
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

describe('/api/budgets/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/budgets/1', {
        method: 'PUT',
        body: JSON.stringify({ budgetAmount: 1000 }),
      });

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return 404 if budget not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.budget.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/budgets/999', {
        method: 'PUT',
        body: JSON.stringify({ budgetAmount: 1000 }),
      });

      await PUT(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockApiError).toHaveBeenCalledWith('Budget not found', 404);
    });

    it('should update budget successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.budget.findUnique as jest.Mock).mockResolvedValue({ budgetId: 1, userId: 1, categoryId: 1, year: 2024, month: 4 });
      (prisma.budget.update as jest.Mock).mockResolvedValue({ budgetId: 1, budgetAmount: 1000 });
      (prisma.budget.updateMany as jest.Mock).mockResolvedValue({});

      const request = new Request('http://localhost/api/budgets/1', {
        method: 'PUT',
        body: JSON.stringify({ budgetAmount: 1000, applyToFutureMonths: true }),
      });

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(prisma.budget.update).toHaveBeenCalledWith({
        where: { budgetId: 1 },
        data: { budgetAmount: 1000 },
        include: { category: true },
      });
      expect(mockApiResponse).toHaveBeenCalledWith({ budgetId: 1, budgetAmount: 1000 });
    });
  });

  describe('DELETE', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/budgets/1', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return 404 if budget not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.budget.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/budgets/999', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockApiError).toHaveBeenCalledWith('Budget not found', 404);
    });

    it('should delete budget successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.budget.findUnique as jest.Mock).mockResolvedValue({ budgetId: 1, userId: 1 });
      (prisma.budget.delete as jest.Mock).mockResolvedValue({});

      const request = new Request('http://localhost/api/budgets/1', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(prisma.budget.delete).toHaveBeenCalledWith({
        where: { budgetId: 1 },
      });
      expect(mockApiResponse).toHaveBeenCalledWith({ budgetId: 1 });
    });
  });
});