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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return apiError('startDate and endDate are required', 400)
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        expenseDate: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { expenseDate: 'asc' },
    })

    // Budget summary: all budgets whose month/year overlaps the date range
    const startMonth = start.getMonth() + 1
    const startYear = start.getFullYear()
    const endMonth = end.getMonth() + 1
    const endYear = end.getFullYear()

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        OR: [
          { year: startYear, month: { gte: startMonth } },
          { year: endYear, month: { lte: endMonth } },
          { year: { gt: startYear, lt: endYear } },
        ],
      },
      include: { category: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })

    // Spending per category for the date range
    const spending = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, expenseDate: { gte: start, lte: end } },
      _sum: { amount: true },
    })

    const spendingMap = new Map(
      spending.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)])
    )

    // Log export
    await prisma.export.create({
      data: {
        userId,
        exportFormat: 'pdf',
        startDate: start,
        endDate: end,
      },
    })

    return apiResponse({
      userName: session.user.name ?? 'User',
      startDate,
      endDate,
      expenses: expenses.map((e) => ({
        date: e.expenseDate.toISOString().split('T')[0],
        vendor: e.vendorName,
        category: e.category.categoryName,
        amount: Number(e.amount),
      })),
      budgetSummary: budgets.map((b) => ({
        categoryName: b.category.categoryName,
        month: b.month,
        year: b.year,
        budgetAmount: Number(b.budgetAmount),
        amountSpent: spendingMap.get(b.categoryId) ?? 0,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
