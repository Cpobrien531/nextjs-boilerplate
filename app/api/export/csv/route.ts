import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiError, handleApiError } from '@/lib/api'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: Prisma.ExpenseWhereInput = { userId: session.user.id }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    if (startDate && endDate) {
      whereClause.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
    })

    // Create CSV
    const csvHeaders = [
      'Date',
      'Name',
      'Category',
      'Amount',
      'Description',
      'Location',
      'Billable',
      'Status',
      'Tags',
    ]

    const csvRows = expenses.map((expense) => [
      expense.expenseDate.toISOString().split('T')[0],
      `"${expense.name.replace(/"/g, '""')}"`,
      expense.category.name,
      expense.amount.toString(),
      `"${(expense.description || '').replace(/"/g, '""')}"`,
      expense.location || '',
      expense.isBillable ? 'Yes' : 'No',
      expense.status,
      expense.tags.map((et) => et.tag.name).join(';'),
    ])

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.join(',')),
    ].join('\n')

    // Mark expenses as exported
    await prisma.expense.updateMany({
      where: whereClause,
      data: { status: 'INCLUDED_IN_EXPORT' },
    })

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="expenses.csv"',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
