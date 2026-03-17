import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { tagSchema } from '@/lib/validations'
import { apiResponse, apiError, handleApiError } from '@/lib/api'
import { ZodError } from 'zod'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
    })

    if (!tag) {
      return apiError('Tag not found', 404)
    }

    if (tag.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    return apiResponse(tag)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
    })

    if (!tag) {
      return apiError('Tag not found', 404)
    }

    if (tag.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    const body = await request.json()
    const validatedData = tagSchema.parse(body)

    const updatedTag = await prisma.tag.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        color: validatedData.color,
      },
    })

    return apiResponse(updatedTag)
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0].message, 400)
    }
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
    })

    if (!tag) {
      return apiError('Tag not found', 404)
    }

    if (tag.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    await prisma.tag.delete({
      where: { id: params.id },
    })

    return apiResponse({ message: 'Tag deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
