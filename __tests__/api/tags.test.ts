import { GET, POST } from '@/app/api/tags/route';
import { prisma } from '@/lib/db';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    tag: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
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

describe('/api/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/tags');
      const response = await GET(request);

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return tags for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const mockTags = [
        { tagId: 1, tagName: 'Work', tagType: 'category' },
        { tagId: 2, tagName: 'Personal', tagType: 'category' },
      ];
      (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request('http://localhost/api/tags');
      const response = await GET(request);

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { tagId: 'asc' },
      });
      expect(mockApiResponse).toHaveBeenCalledWith(mockTags);
    });
  });

  describe('POST', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/tags', {
        method: 'POST',
        body: JSON.stringify({ tagName: 'Test' }),
      });
      const response = await POST(request);

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401);
    });

    it('should return 400 if tagName is missing', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });

      const request = new Request('http://localhost/api/tags', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(mockApiError).toHaveBeenCalledWith('Tag name is required', 400);
    });

    it('should create tag successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      (prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);
      const mockTag = { tagId: 1, tagName: 'Test', tagType: 'category' };
      (prisma.tag.create as jest.Mock).mockResolvedValue(mockTag);

      const request = new Request('http://localhost/api/tags', {
        method: 'POST',
        body: JSON.stringify({ tagName: 'Test', tagType: 'category' }),
      });
      const response = await POST(request);

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          tagName: 'Test',
          tagType: 'category',
        },
      });
      expect(mockApiResponse).toHaveBeenCalledWith(mockTag, 201);
    });
  });
});