import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateBudgetSummary } from '@/lib/ai'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || new Date().getMonth() + 1
    const year = searchParams.get('year') || new Date().getFullYear()

    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0)

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'DELETED' },
      },
      include: {
        category: true,
      },
    })

    if (expenses.length === 0) {
      return apiResponse({
        summary: 'No expenses recorded for this period.',
        totalSpent: 0,
        expenses: [],
      })
    }

    const formattedExpenses = expenses.map((e) => ({
      name: e.name,
      amount: Number(e.amount),
      category: e.category.name,
    }))

    const summary = await generateBudgetSummary(formattedExpenses)

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

    return apiResponse({
      summary,
      totalSpent,
      expenses: formattedExpenses,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
