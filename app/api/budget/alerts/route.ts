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
    const today = new Date()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    // Get all budgets for the current month
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month,
        year,
      },
      include: { category: true },
    })

    const alerts = []

    for (const budget of budgets) {
      const expenses = await prisma.expense.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          expenseDate: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0),
          },
        },
        _sum: {
          amount: true,
        },
      })

      const spent = Number(expenses._sum.amount || 0)
      const budgetAmount = Number(budget.budgetAmount)
      const percentageSpent = (spent / budgetAmount) * 100

      if (percentageSpent >= 90) {
        alerts.push({
          budgetId: budget.budgetId,
          categoryId: budget.categoryId,
          categoryName: budget.category.categoryName,
          budget: budgetAmount,
          spent,
          percentageSpent: parseFloat(percentageSpent.toFixed(2)),
          severity: percentageSpent >= 100 ? 'critical' : 'warning',
        })
      }
    }

    return apiResponse({
      alerts,
      hasAlerts: alerts.length > 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
