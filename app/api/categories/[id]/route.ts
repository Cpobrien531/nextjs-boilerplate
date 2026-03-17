import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { categorySchema } from '@/lib/validations'
import { apiResponse, apiError, handleApiError } from '@/lib/api'
import { ZodError } from 'zod'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return apiError('Category not found', 404)
    }

    if (category.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    return apiResponse(category)
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

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return apiError('Category not found', 404)
    }

    if (category.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        icon: validatedData.icon,
        color: validatedData.color,
        monthlyBudget: validatedData.monthlyBudget,
      },
    })

    return apiResponse(updatedCategory)
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

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return apiError('Category not found', 404)
    }

    if (category.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    await prisma.category.delete({
      where: { id: params.id },
    })

    return apiResponse({ message: 'Category deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
