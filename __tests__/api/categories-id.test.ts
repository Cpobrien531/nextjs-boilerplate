import { PUT, DELETE } from '@/app/api/categories/[id]/route';
import { prisma } from '@/lib/db';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    category: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    expense: {
      count: jest.fn(),
    },
    budget: {
      count: jest.fn(),
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

describe('/api/categories/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Category' }),
      });

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return 404 if category not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/categories/999', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Category' }),
      });

      await PUT(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockApiError).toHaveBeenCalledWith('Category not found', 404);
    });

    it('should update category successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({ categoryId: 1, categoryName: 'Old Name' });
      (prisma.category.update as jest.Mock).mockResolvedValue({ categoryId: 1, categoryName: 'Updated Category' });

      const request = new Request('http://localhost/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify({ categoryName: 'Updated Category' }),
      });

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        data: { categoryName: 'Updated Category' },
      });
      expect(mockApiResponse).toHaveBeenCalledWith({ categoryId: 1, categoryName: 'Updated Category' });
    });
  });

  describe('DELETE', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/categories/1', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return 404 if category not found', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/categories/999', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockApiError).toHaveBeenCalledWith('Category not found', 404);
    });

    it('should delete category successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({ categoryId: 1 });
      (prisma.category.delete as jest.Mock).mockResolvedValue({});

      const request = new Request('http://localhost/api/categories/1', {
        method: 'DELETE',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { categoryId: 1 },
      });
      expect(mockApiResponse).toHaveBeenCalledWith({ message: 'Category deleted successfully' });
    });
  });
});