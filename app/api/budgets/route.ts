import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)
    const userId = parseInt(session.user.id)

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))
    const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const [budgets, spendingRows] = await Promise.all([
      prisma.budget.findMany({
        where: { userId, month, year },
        include: { category: true },
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          expenseDate: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
      }),
    ])

    const spendingMap = new Map<number, number>()
    for (const row of spendingRows) {
      spendingMap.set(row.categoryId, Number(row._sum.amount ?? 0))
    }

    const result = budgets.map((b) => ({
      budgetId: b.budgetId,
      categoryId: b.categoryId,
      categoryName: b.category.categoryName,
      month: b.month,
      year: b.year,
      budgetAmount: Number(b.budgetAmount),
      amountSpent: spendingMap.get(b.categoryId) ?? 0,
    }))

    return apiResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)
    const userId = parseInt(session.user.id)

    const body = await request.json()
    const { categoryName, month, year, budgetAmount } = body as {
      categoryName: string
      month: number
      year: number
      budgetAmount: number
    }

    if (!categoryName || !month || !year || budgetAmount == null) {
      return apiError('categoryName, month, year, and budgetAmount are required', 400)
    }

    const category = await prisma.category.upsert({
      where: { categoryName },
      update: {},
      create: { categoryName },
    })

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: category.categoryId,
          month,
          year,
        },
      },
      update: { budgetAmount },
      create: {
        userId,
        categoryId: category.categoryId,
        month,
        year,
        budgetAmount,
      },
      include: { category: true },
    })

    return apiResponse(
      {
        budgetId: budget.budgetId,
        categoryId: budget.categoryId,
        categoryName: budget.category.categoryName,
        month: budget.month,
        year: budget.year,
        budgetAmount: Number(budget.budgetAmount),
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
