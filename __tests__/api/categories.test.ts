import { GET, POST, DELETE } from '@/app/api/categories/route';
import { prisma } from '@/lib/db';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
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

import { apiResponse, apiError } from '@/lib/api';

const mockApiResponse = apiResponse as jest.Mock;
const mockApiError = apiError as jest.Mock;

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return category names by default', async () => {
      const mockCategories = [
        { categoryId: 1, categoryName: 'Food', categoryDescription: null },
        { categoryId: 2, categoryName: 'Transportation', categoryDescription: null },
      ];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const request = new Request('http://localhost/api/categories');
      const response = await GET(request);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { categoryName: 'asc' },
      });

      expect(mockApiResponse).toHaveBeenCalledWith(['Food', 'Transportation']);
    });

    it('should return full category objects when full=true', async () => {
      const mockCategories = [
        { categoryId: 1, categoryName: 'Food', categoryDescription: 'Food expenses' },
      ];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const request = new Request('http://localhost/api/categories?full=true');
      const response = await GET(request);

      expect(mockApiResponse).toHaveBeenCalledWith(mockCategories);
    });
  });

  describe('POST', () => {
    it('should return 400 if name is empty', async () => {
      const request = new Request('http://localhost/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      const response = await POST(request);

      expect(mockApiError).toHaveBeenCalledWith('Category name is required', 400);
    });

    it('should create category successfully', async () => {
      const mockCategory = {
        categoryId: 1,
        categoryName: 'New Category',
        categoryDescription: 'Description',
      };

      (prisma.category.upsert as jest.Mock).mockResolvedValue(mockCategory);

      const request = new Request('http://localhost/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Category', description: 'Description' }),
      });

      const response = await POST(request);

      expect(prisma.category.upsert).toHaveBeenCalledWith({
        where: { categoryName: 'New Category' },
        update: { categoryDescription: 'Description' },
        create: {
          categoryName: 'New Category',
          categoryDescription: 'Description',
        },
      });

      expect(mockApiResponse).toHaveBeenCalledWith(mockCategory, 201);
    });
  });

  describe('DELETE', () => {
    it('should return 400 if name is empty', async () => {
      const request = new Request('http://localhost/api/categories', {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(mockApiError).toHaveBeenCalledWith('Category name is required', 400);
    });

    it('should return 404 if category not found', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/categories?name=NonExistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(mockApiError).toHaveBeenCalledWith('Category not found', 404);
    });

    it('should delete category successfully', async () => {
      const mockCategory = { categoryId: 1, categoryName: 'Test' };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.expense.count as jest.Mock).mockResolvedValue(0);
      (prisma.budget.count as jest.Mock).mockResolvedValue(0);

      const request = new Request('http://localhost/api/categories?name=Test', {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { categoryId: 1 },
      });

      expect(mockApiResponse).toHaveBeenCalledWith({ message: 'Category deleted successfully' });
    });

    it('should prevent deletion if category has expenses', async () => {
      const mockCategory = { categoryId: 1, categoryName: 'Test' };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.expense.count as jest.Mock).mockResolvedValue(1);

      const request = new Request('http://localhost/api/categories?name=Test', {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(mockApiError).toHaveBeenCalledWith('Cannot delete category that has associated expenses', 400);
    });
  });
});