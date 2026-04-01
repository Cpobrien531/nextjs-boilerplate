import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiError, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)
    const userId = parseInt(session.user.id)

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return apiError('startDate and endDate are required', 400)
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        expenseDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: { category: true },
      orderBy: { expenseDate: 'asc' },
    })

    const rows = [
      ['Date', 'Vendor', 'Category', 'Amount', 'Billable'],
      ...expenses.map((e) => [
        e.expenseDate.toISOString().split('T')[0],
        `"${e.vendorName.replace(/"/g, '""')}"`,
        `"${e.category.categoryName.replace(/"/g, '""')}"`,
        Number(e.amount).toFixed(2),
        e.isBillable ? 'Yes' : 'No',
      ]),
    ]

    const csv = rows.map((r) => r.join(',')).join('\n')

    // Log export to the export table
    await prisma.export.create({
      data: {
        userId,
        exportFormat: 'csv',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    })

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses_${startDate}_to_${endDate}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
