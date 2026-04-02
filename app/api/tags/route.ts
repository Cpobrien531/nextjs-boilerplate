import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const userId = parseInt(session.user.id)

    const tags = await prisma.tag.findMany({
      where: { userId },
      orderBy: { tagId: 'asc' },
    })

    return apiResponse(tags)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const userId = parseInt(session.user.id)
    const body = await request.json()
    const { tagName, tagType } = body

    if (!tagName) {
      return apiError('Tag name is required', 400)
    }

    // Check if tag with same name already exists for this user
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId,
        tagName,
      },
    })

    if (existingTag) {
      return apiError('Tag with this name already exists', 400)
    }

    const tag = await prisma.tag.create({
      data: {
        userId,
        tagName,
        tagType: tagType || 'general',
      },
    })

    return apiResponse(tag, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
