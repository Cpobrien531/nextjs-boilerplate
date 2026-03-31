import { prisma } from '@/lib/db'
import { categorySchema } from '@/lib/validations'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET(_request: Request) {
  try {
    const categories = await prisma.category.findMany({
      select: { categoryName: true },
      orderBy: { categoryName: 'asc' },
    })
    return apiResponse(categories.map((c) => c.categoryName))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name?.trim()) {
      return apiError('Category name is required', 400)
    }

    const category = await prisma.category.upsert({
      where: { categoryName: name.trim() },
      update: {},
      create: { categoryName: name.trim() },
    })

    return apiResponse({ name: category.categoryName }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
