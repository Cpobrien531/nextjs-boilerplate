import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { tagSchema } from '@/lib/validations'
import { apiResponse, apiError, handleApiError } from '@/lib/api'
import { ZodError } from 'zod'

export async function GET(_request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })

    return apiResponse(tags)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const validatedData = tagSchema.parse(body)

    // Check if tag with same name already exists for this user
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId: session.user.id,
        name: validatedData.name,
      },
    })

    if (existingTag) {
      return apiError('Tag with this name already exists', 400)
    }

    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        color: validatedData.color,
      },
    })

    return apiResponse(tag, 201)
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0].message, 400)
    }
    return handleApiError(error)
  }
}
