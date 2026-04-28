import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt(session.user.id)
    const { id } = await params
    const expenseId = parseInt(id)

    // DB CALL: find the expense by ID to make sure it exists before trying to edit it
    const expense = await prisma.expense.findUnique({ where: { expenseId } })
    if (!expense) return apiError('Expense not found', 404)
    // ownership check — makes sure you can only edit YOUR own expenses
    if (expense.userId !== userId) return apiError('Forbidden', 403)

    const { amount, description, category, date, tags = [] } = await request.json()

    let categoryId = expense.categoryId
    if (category) {
      // DB CALL: upsert the category — same as on create, reuse existing or make a new one
      const categoryRecord = await prisma.category.upsert({
        where: { categoryName: category },
        update: {},
        create: { categoryName: category },
      })
      categoryId = categoryRecord.categoryId
    }

    // DB CALL: update only the fields that were actually sent — unchanged fields are left alone
    const updatedExpense = await prisma.expense.update({
      where: { expenseId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { vendorName: description }),
        ...(date !== undefined && { expenseDate: new Date(date) }),
        ...(category !== undefined && { categoryId }),
      },
    })

    if (tags && tags.length > 0) {
      // DB CALL: wipe all existing tags on this expense so we can replace them cleanly
      await prisma.expenseTag.deleteMany({ where: { expenseId } })

      for (const tagName of tags as string[]) {
        // DB CALL: reuse existing tag or create a new one for this user
        let tag = await prisma.tag.findFirst({ where: { userId, tagName } })
        if (!tag) {
          tag = await prisma.tag.create({
            data: { userId, tagName, tagType: 'custom' },
          })
        }
        // DB CALL: re-link each tag to the expense in the join table
        await prisma.expenseTag.create({
          data: { expenseId, tagId: tag.tagId },
        })
      }
    }

    return apiResponse(updatedExpense)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt(session.user.id)
    const { id } = await params
    const expenseId = parseInt(id)

    const expense = await prisma.expense.findUnique({ where: { expenseId } })
    if (!expense) return apiError('Expense not found', 404)
    if (expense.userId !== userId) return apiError('Forbidden', 403)

    // Delete related records first to avoid foreign key constraints
    await prisma.expenseTag.deleteMany({ where: { expenseId } })
    await prisma.receipt.deleteMany({ where: { expenseId } })

    // Now delete the expense
    await prisma.expense.delete({ where: { expenseId } })
    return apiResponse({ message: 'Expense deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
