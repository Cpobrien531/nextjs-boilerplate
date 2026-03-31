import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { categorizeExpense } from '@/lib/ai'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { expenseName, description } = body

    if (!expenseName) {
      return apiError('Expense name is required', 400)
    }

    // Get user's categories
    const userCategories = await prisma.category.findMany({
      where: { userId: session.user.id },
    })

    const categoryNames = userCategories.map((c) => c.name)

    // Use AI to categorize
    const result = await categorizeExpense(expenseName, description, categoryNames)

    // Find the category ID by name
    const matchedCategory = userCategories.find((c) => c.name === result.category)

    return apiResponse({
      suggestedCategory: result.category,
      categoryId: matchedCategory?.id,
      confidence: result.confidence,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
