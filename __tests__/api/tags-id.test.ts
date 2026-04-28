import { GET, PUT, DELETE } from '@/app/api/tags/[id]/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    tag: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

import { apiResponse, apiError } from '@/lib/api'

const mockApiResponse = apiResponse as jest.Mock
const mockApiError = apiError as jest.Mock

describe('/api/tags/[id]', () => {
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = {
      user: { id: '1' },
    }
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET', () => {
    it('should return tag for authenticated user', async () => {
      const mockTag = {
        tagId: 1,
        tagName: 'Test Tag',
        tagType: 'custom',
        userId: 1,
      }

      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag)

      const request = new Request('http://localhost:3000/api/tags/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiResponse).toHaveBeenCalledWith(mockTag)
      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { tagId: 1 },
      })
    })

    it('should return 403 for tag owned by different user', async () => {
      const mockTag = {
        tagId: 1,
        tagName: 'Test Tag',
        tagType: 'custom',
        userId: 2, // Different user
      }

      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag)

      const request = new Request('http://localhost:3000/api/tags/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiError).toHaveBeenCalledWith('Forbidden', 403)
    })

    it('should return 404 for non-existent tag', async () => {
      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tags/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })

      expect(mockApiError).toHaveBeenCalledWith('Tag not found', 404)
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tags/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })

  describe('PUT', () => {
    it('should update tag successfully', async () => {
      const mockTag = {
        tagId: 1,
        tagName: 'Old Tag',
        tagType: 'custom',
        userId: 1,
      }
      const updatedTag = {
        tagId: 1,
        tagName: 'New Tag',
        tagType: 'custom',
        userId: 1,
      }

      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag)
      ;(prisma.tag.update as jest.Mock).mockResolvedValue(updatedTag)

      const request = new Request('http://localhost:3000/api/tags/1', {
        method: 'PUT',
        body: JSON.stringify({ tagName: 'New Tag' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiResponse).toHaveBeenCalledWith(updatedTag)
      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { tagId: 1 },
        data: { tagName: 'New Tag' },
      })
    })

    it('should return 403 for tag owned by different user', async () => {
      const mockTag = {
        tagId: 1,
        tagName: 'Test Tag',
        tagType: 'custom',
        userId: 2,
      }

      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag)

      const request = new Request('http://localhost:3000/api/tags/1', {
        method: 'PUT',
        body: JSON.stringify({ tagName: 'New Name' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiError).toHaveBeenCalledWith('Forbidden', 403)
    })

    it('should return 404 for non-existent tag', async () => {
      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tags/999', {
        method: 'PUT',
        body: JSON.stringify({ tagName: 'New Name' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })

      expect(mockApiError).toHaveBeenCalledWith('Tag not found', 404)
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tags/1', {
        method: 'PUT',
        body: JSON.stringify({ tagName: 'New Name' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })

  describe('DELETE', () => {
    it('should delete tag successfully', async () => {
      const mockTag = {
        tagId: 1,
        tagName: 'Test Tag',
        tagType: 'custom',
        userId: 1,
      }

      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag)
      ;(prisma.tag.delete as jest.Mock).mockResolvedValue(mockTag)

      const request = new Request('http://localhost:3000/api/tags/1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiResponse).toHaveBeenCalledWith({ message: 'Tag deleted successfully' })
      expect(prisma.tag.delete).toHaveBeenCalledWith({
        where: { tagId: 1 },
      })
    })

    it('should return 403 for tag owned by different user', async () => {
      const mockTag = {
        tagId: 1,
        tagName: 'Test Tag',
        tagType: 'custom',
        userId: 2,
      }

      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag)

      const request = new Request('http://localhost:3000/api/tags/1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiError).toHaveBeenCalledWith('Forbidden', 403)
    })

    it('should return 404 for non-existent tag', async () => {
      ;(prisma.tag.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tags/999', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) })

      expect(mockApiError).toHaveBeenCalledWith('Tag not found', 404)
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tags/1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(mockApiError).toHaveBeenCalledWith('Unauthorized', 401)
    })
  })
})