import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { categorizeExpense } from '@/lib/ai'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const userId = parseInt(session.user.id)
    const body = await request.json()
    const { expenseName, description } = body

    if (!expenseName) {
      return apiError('Expense name is required', 400)
    }

    // Get all categories
    const userCategories = await prisma.category.findMany()

    const categoryNames = userCategories.map((c) => c.categoryName)

    // Use AI to categorize
    const result = await categorizeExpense(expenseName, description, categoryNames)

    // Find the category ID by name
    const matchedCategory = userCategories.find((c) => c.categoryName === result.category)

    return apiResponse({
      suggestedCategory: result.category,
      categoryId: matchedCategory?.categoryId,
      confidence: result.confidence,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
