import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const userId = parseInt(session.user.id)
    const { id } = await params
    const tagId = parseInt(id)

    const tag = await prisma.tag.findUnique({
      where: { tagId },
    })

    if (!tag) {
      return apiError('Tag not found', 404)
    }

    if (tag.userId !== userId) {
      return apiError('Forbidden', 403)
    }

    return apiResponse(tag)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const userId = parseInt(session.user.id)
    const { id } = await params
    const tagId = parseInt(id)

    const tag = await prisma.tag.findUnique({
      where: { tagId },
    })

    if (!tag) {
      return apiError('Tag not found', 404)
    }

    if (tag.userId !== userId) {
      return apiError('Forbidden', 403)
    }

    const body = await request.json()
    const { tagName } = body

    const updatedTag = await prisma.tag.update({
      where: { tagId },
      data: {
        ...(tagName && { tagName }),
      },
    })

    return apiResponse(updatedTag)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const userId = parseInt(session.user.id)
    const { id } = await params
    const tagId = parseInt(id)

    const tag = await prisma.tag.findUnique({
      where: { tagId },
    })

    if (!tag) {
      return apiError('Tag not found', 404)
    }

    if (tag.userId !== userId) {
      return apiError('Forbidden', 403)
    }

    await prisma.tag.delete({
      where: { tagId },
    })

    return apiResponse({ message: 'Tag deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
