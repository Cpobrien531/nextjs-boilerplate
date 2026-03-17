import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { categorySchema, tagSchema } from '@/lib/validations'
import { apiResponse, apiError, handleApiError } from '@/lib/api'
import { ZodError } from 'zod'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })

    return apiResponse(categories)
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
    const validatedData = categorySchema.parse(body)

    // Check if category with same name already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        name: validatedData.name,
      },
    })

    if (existingCategory) {
      return apiError('Category with this name already exists', 400)
    }

    const category = await prisma.category.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        icon: validatedData.icon,
        color: validatedData.color,
        monthlyBudget: validatedData.monthlyBudget,
      },
    })

    return apiResponse(category, 201)
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0].message, 400)
    }
    return handleApiError(error)
  }
}
