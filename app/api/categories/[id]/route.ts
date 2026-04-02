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
    const categoryId = parseInt(id)

    const category = await prisma.category.findUnique({
      where: { categoryId },
    })

    if (!category) {
      return apiError('Category not found', 404)
    }

    return apiResponse(category)
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
    const categoryId = parseInt(id)

    const category = await prisma.category.findUnique({
      where: { categoryId },
    })

    if (!category) {
      return apiError('Category not found', 404)
    }

    const body = await request.json()
    const { categoryName, categoryDescription } = body

    const updatedCategory = await prisma.category.update({
      where: { categoryId },
      data: {
        ...(categoryName && { categoryName }),
        ...(categoryDescription !== undefined && { categoryDescription }),
      },
    })

    return apiResponse(updatedCategory)
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
    const categoryId = parseInt(id)

    const category = await prisma.category.findUnique({
      where: { categoryId },
    })

    if (!category) {
      return apiError('Category not found', 404)
    }

    await prisma.category.delete({
      where: { categoryId },
    })

    return apiResponse({ message: 'Category deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
