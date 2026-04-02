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
    const months = parseInt(searchParams.get('months') || '12')

    const today = new Date()
    const historicalData: any[] = []

    // Get the last N months of budget data
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          month,
          year,
        },
        include: { category: true },
      })

      const monthData: any = {
        month,
        year,
        monthLabel: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        categories: [] as any[],
        totalBudget: 0,
        totalSpent: 0,
        totalPercentage: 0,
      }

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
          _sum: { amount: true },
        })

        const spent = Number(expenses._sum.amount || 0)
        const budgetAmount = Number(budget.budgetAmount)
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

        monthData.categories.push({
          categoryId: budget.categoryId,
          categoryName: budget.category.categoryName,
          budget: budgetAmount,
          spent,
          percentage: parseFloat(percentage.toFixed(2)),
          status: percentage > 100 ? 'over' : percentage >= 90 ? 'warning' : 'on-track',
        })

        monthData.totalBudget += budgetAmount
        monthData.totalSpent += spent
      }

      if (monthData.totalBudget > 0) {
        monthData.totalPercentage = parseFloat(
          ((monthData.totalSpent / monthData.totalBudget) * 100).toFixed(2)
        )
      }

      if (monthData.categories.length > 0) {
        historicalData.push(monthData)
      }
    }

    return apiResponse({
      history: historicalData.reverse(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
