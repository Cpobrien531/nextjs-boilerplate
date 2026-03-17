import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { expenseSchema } from '@/lib/validations'
import { apiResponse, apiError, handleApiError } from '@/lib/api'
import { ZodError } from 'zod'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = { userId: session.user.id }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    if (status) {
      whereClause.status = status
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.expense.count({ where: whereClause })

    return apiResponse({
      expenses,
      total,
      limit,
      offset,
    })
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
    const validatedData = expenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        amount: validatedData.amount,
        expenseDate: new Date(validatedData.expenseDate),
        categoryId: validatedData.categoryId,
        location: validatedData.location,
        isBillable: validatedData.isBillable,
        status: 'DRAFT',
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return apiResponse(expense, 201)
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0].message, 400)
    }
    return handleApiError(error)
  }
}
