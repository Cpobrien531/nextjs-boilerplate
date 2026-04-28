// Mock Response
global.Response = {
  json: jest.fn().mockImplementation((data, options) => ({
    status: options?.status || 200,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve(data),
  })),
} as any

import { ApiError, apiResponse, apiError, handleApiError } from '@/lib/api'

describe('API utilities', () => {
  describe('ApiError', () => {
    it('should create an ApiError with status code and message', () => {
      const error = new ApiError(404, 'Not found')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error.name).toBe('ApiError')
    })
  })

  describe('apiResponse', () => {
    it('should return a successful response with data', () => {
      const data = { id: 1, name: 'test' }
      const response = apiResponse(data, 201)

      expect(response.status).toBe(201)
      expect(response.headers.get('content-type')).toBe('application/json')
    })

    it('should return a successful response with default status 200', () => {
      const data = { success: true }
      const response = apiResponse(data)

      expect(response.status).toBe(200)
    })
  })

  describe('apiError', () => {
    it('should return an error response with message', () => {
      const response = apiError('Something went wrong', 500)

      expect(response.status).toBe(500)
      expect(response.headers.get('content-type')).toBe('application/json')
    })

    it('should return an error response with default status 400', () => {
      const response = apiError('Bad request')

      expect(response.status).toBe(400)
    })
  })

  describe('handleApiError', () => {
    it('should handle ApiError instances', () => {
      const apiErr = new ApiError(422, 'Validation failed')
      const response = handleApiError(apiErr)

      expect(response.status).toBe(422)
    })

    it('should handle generic Error instances', () => {
      const error = new Error('Database connection failed')
      const response = handleApiError(error)

      expect(response.status).toBe(500)
    })

    it('should handle unknown errors', () => {
      const error = 'string error'
      const response = handleApiError(error)

      expect(response.status).toBe(500)
    })
  })
})