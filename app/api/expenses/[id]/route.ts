import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt((session.user as any).id)
    const { id } = await params
    const expenseId = parseInt(id)

    const expense = await prisma.expense.findUnique({ where: { expenseId } })
    if (!expense) return apiError('Expense not found', 404)
    if (expense.userId !== userId) return apiError('Forbidden', 403)

    await prisma.expense.delete({ where: { expenseId } })
    return apiResponse({ message: 'Expense deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
