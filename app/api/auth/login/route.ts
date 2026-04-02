import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return apiError('Email and password are required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return apiError('Invalid email or password', 401)
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return apiError('Invalid email or password', 401)
    }

    return apiResponse({
      id: String(user.userId),
      email: user.email,
      name: user.fullName,
    })
  } catch (_error) {
    return handleApiError(_error)
  }
}

