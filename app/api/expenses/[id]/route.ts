import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { expenseSchema } from '@/lib/validations'
import { apiResponse, apiError, handleApiError } from '@/lib/api'
import { ZodError } from 'zod'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!expense) {
      return apiError('Expense not found', 404)
    }

    if (expense.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    return apiResponse(expense)
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

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    })

    if (!expense) {
      return apiError('Expense not found', 404)
    }

    if (expense.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    const body = await request.json()
    const validatedData = expenseSchema.parse(body)

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        amount: validatedData.amount,
        expenseDate: new Date(validatedData.expenseDate),
        categoryId: validatedData.categoryId,
        location: validatedData.location,
        isBillable: validatedData.isBillable,
        status: 'EDITED',
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

    return apiResponse(updatedExpense)
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

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    })

    if (!expense) {
      return apiError('Expense not found', 404)
    }

    if (expense.userId !== session.user.id) {
      return apiError('Forbidden', 403)
    }

    await prisma.expense.delete({
      where: { id: params.id },
    })

    return apiResponse({ message: 'Expense deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
