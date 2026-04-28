// Mock next-auth
jest.mock('next-auth', () => ({
  NextAuthOptions: jest.fn(),
}))

// Mock next-auth/providers/credentials
jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn((options) => ({
    ...options,
    authorize: options.authorize,
  })),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

import { authOptions } from '@/lib/auth'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'

const mockCompare = compare as jest.MockedFunction<typeof compare>
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>

describe('authOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have correct configuration', () => {
    expect(authOptions.providers).toBeDefined()
    expect(authOptions.pages).toEqual({
      signIn: '/login',
      error: '/login',
    })
    expect(authOptions.callbacks).toBeDefined()
    expect(authOptions.session).toEqual({ strategy: 'jwt' })
  })

  it('should have credentials provider with correct config', () => {
    const provider = authOptions.providers[0]
    expect(provider.name).toBe('credentials')
    expect(provider.credentials).toEqual({
      email: { label: 'Email', type: 'text' },
      password: { label: 'Password', type: 'password' },
    })
    expect(typeof provider.authorize).toBe('function')
  })

  it('should have JWT callback', () => {
    expect(typeof authOptions.callbacks?.jwt).toBe('function')
  })

  it('should have session callback', () => {
    expect(typeof authOptions.callbacks?.session).toBe('function')
  })
})