import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET(_request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Get all categories with current month spending
    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
    })

    const alerts = []

    for (const category of categories) {
      if (category.monthlyBudget > 0) {
        const expenses = await prisma.expense.aggregate({
          where: {
            categoryId: category.id,
            expenseDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            status: { not: 'DELETED' },
          },
          _sum: {
            amount: true,
          },
        })

        const spent = expenses._sum.amount || 0
        const percentageSpent = (Number(spent) / category.monthlyBudget) * 100

        if (percentageSpent >= 80) {
          alerts.push({
            categoryId: category.id,
            categoryName: category.name,
            budget: Number(category.monthlyBudget),
            spent: Number(spent),
            percentageSpent: parseFloat(percentageSpent.toFixed(2)),
            severity: percentageSpent >= 100 ? 'critical' : 'warning',
          })
        }
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
