import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/db';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock lib/api
jest.mock('@/lib/api', () => ({
  apiResponse: jest.fn((data, status = 200) => ({ data, status })),
  apiError: jest.fn((message, status = 400) => ({ error: message, status })),
  handleApiError: jest.fn((error) => ({ error: 'Internal server error', status: 500 })),
}));

import { apiResponse, apiError } from '@/lib/api';
import { compare, hash } from 'bcryptjs';

const mockApiResponse = apiResponse as jest.Mock;
const mockApiError = apiError as jest.Mock;
const mockCompare = compare as jest.Mock;
const mockHash = hash as jest.Mock;

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return user data on successful login', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'hashedpassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockCompare.mockResolvedValue(true);
      mockApiResponse.mockReturnValue({ data: { id: '1', email: 'test@example.com', name: 'Test User' }, status: 200 });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await loginPOST(request);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockCompare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockApiResponse).toHaveBeenCalledWith({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(response).toEqual({ data: { id: '1', email: 'test@example.com', name: 'Test User' }, status: 200 });
    });

    it('should return error for missing email or password', async () => {
      mockApiError.mockReturnValue({ error: 'Email and password are required', status: 400 });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await loginPOST(request);

      expect(mockApiError).toHaveBeenCalledWith('Email and password are required', 400);
      expect(response).toEqual({ error: 'Email and password are required', status: 400 });
    });

    it('should return error for invalid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockApiError.mockReturnValue({ error: 'Invalid email or password', status: 401 });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid@example.com', password: 'password123' }),
      });

      const response = await loginPOST(request);

      expect(mockApiError).toHaveBeenCalledWith('Invalid email or password', 401);
      expect(response).toEqual({ error: 'Invalid email or password', status: 401 });
    });

    it('should return error for invalid password', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'hashedpassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockCompare.mockResolvedValue(false);
      mockApiError.mockReturnValue({ error: 'Invalid email or password', status: 401 });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
      });

      const response = await loginPOST(request);

      expect(mockCompare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(mockApiError).toHaveBeenCalledWith('Invalid email or password', 401);
    });
  });
});

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create user and return data on successful registration', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockHash.mockResolvedValue('hashedpassword');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      mockApiResponse.mockReturnValue({ data: { id: '1', email: 'test@example.com', name: 'Test User' }, status: 201 });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', name: 'Test User', password: 'password123' }),
      });

      const response = await registerPOST(request);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockHash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'hashedpassword',
        },
      });
      expect(mockApiResponse).toHaveBeenCalledWith({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      }, 201);
      expect(response).toEqual({ data: { id: '1', email: 'test@example.com', name: 'Test User' }, status: 201 });
    });

    it('should return error for existing user', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockApiError.mockReturnValue({ error: 'User already exists', status: 400 });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', name: 'Test User', password: 'password123' }),
      });

      const response = await registerPOST(request);

      expect(mockApiError).toHaveBeenCalledWith('User already exists', 400);
      expect(response).toEqual({ error: 'User already exists', status: 400 });
    });

    it('should return error for invalid data', async () => {
      mockApiError.mockReturnValue({ error: 'Invalid email address', status: 400 });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email', name: 'Test User', password: 'password123' }),
      });

      const response = await registerPOST(request);

      expect(mockApiError).toHaveBeenCalledWith('Invalid email address', 400);
      expect(response).toEqual({ error: 'Invalid email address', status: 400 });
    });
  });
});