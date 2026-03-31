import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt((session.user as any).id)

    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { expenseDate: 'desc' },
    })

    return apiResponse(
      expenses.map((e) => ({
        id: String(e.expenseId),
        amount: Number(e.amount),
        description: e.vendorName,
        category: e.category.categoryName,
        date: e.expenseDate.toISOString().split('T')[0],
        tags: e.tags.map((t) => t.tag.tagName),
      }))
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt((session.user as any).id)
    const { amount, description, category, date, tags = [] } = await request.json()

    const categoryRecord = await prisma.category.upsert({
      where: { categoryName: category },
      update: {},
      create: { categoryName: category },
    })

    const expense = await prisma.expense.create({
      data: {
        userId,
        vendorName: description,
        amount,
        expenseDate: new Date(date),
        categoryId: categoryRecord.categoryId,
      },
    })

    for (const tagName of tags as string[]) {
      let tag = await prisma.tag.findFirst({ where: { userId, tagName } })
      if (!tag) {
        tag = await prisma.tag.create({
          data: { userId, tagName, tagType: 'custom' },
        })
      }
      await prisma.expenseTag.create({
        data: { expenseId: expense.expenseId, tagId: tag.tagId },
      })
    }

    return apiResponse({ id: String(expense.expenseId) }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
