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
    const userId = parseInt(session.user.id)

    const { id } = await params
    const budgetId = parseInt(id)

    if (isNaN(budgetId)) return apiError('Invalid budget ID', 400)

    const budget = await prisma.budget.findUnique({ where: { budgetId } })

    if (!budget) return apiError('Budget not found', 404)
    if (budget.userId !== userId) return apiError('Forbidden', 403)

    await prisma.budget.delete({ where: { budgetId } })

    return apiResponse({ budgetId })
  } catch (error) {
    return handleApiError(error)
  }
}
