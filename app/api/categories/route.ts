import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const full = url.searchParams.get('full') === 'true'

    const categories = await prisma.category.findMany({
      orderBy: { categoryName: 'asc' },
    })

    if (full) {
      return apiResponse(categories)
    }

    return apiResponse(categories.map((c) => c.categoryName))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json()

    if (!name?.trim()) {
      return apiError('Category name is required', 400)
    }

    const category = await prisma.category.upsert({
      where: { categoryName: name.trim() },
      update: {
        ...(description !== undefined && { categoryDescription: description }),
      },
      create: {
        categoryName: name.trim(),
        categoryDescription: description,
      },
    })

    return apiResponse(category, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const categoryName = url.searchParams.get('name')

    if (!categoryName?.trim()) {
      return apiError('Category name is required', 400)
    }

    const category = await prisma.category.findUnique({
      where: { categoryName: categoryName.trim() },
    })

    if (!category) {
      return apiError('Category not found', 404)
    }

    // Check if category is used in expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: category.categoryId },
    })

    if (expenseCount > 0) {
      return apiError('Cannot delete category that has associated expenses', 400)
    }

    // Check if category is used in budgets
    const budgetCount = await prisma.budget.count({
      where: { categoryId: category.categoryId },
    })

    if (budgetCount > 0) {
      return apiError('Cannot delete category that has assigned budgets', 400)
    }

    await prisma.category.delete({
      where: { categoryId: category.categoryId },
    })

    return apiResponse({ message: 'Category deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
