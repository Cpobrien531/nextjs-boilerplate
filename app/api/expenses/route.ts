import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt(session.user.id)

    // DB CALL: fetch all expenses for this user, join in their category and tags, newest first
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
    console.log('Session:', session)
    console.log('Session user:', session?.user)
    console.log('Session user id:', session?.user?.id)
    
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt(session.user.id)
    console.log('Parsed userId:', userId)
    
    // DB CALL: confirm this user ID actually exists in the User table before touching anything
    const user = await prisma.user.findUnique({ where: { userId } })
    console.log('Found user:', user)
    
    if (!user) return apiError('User not found', 404)

    // UNWRAP: converts the JSON string sent from page.tsx back into a JavaScript object
    const { amount, description, category, date, tags = [] } = await request.json()
    console.log('Expense data:', { amount, description, category, date, tags })

    // DB CALL: upsert = find the category if it exists, create it if it doesn't — no duplicates
    const categoryRecord = await prisma.category.upsert({
      where: { categoryName: category },
      update: {},
      create: { categoryName: category },
    })
    console.log('Category record:', categoryRecord)

    // DB CALL: insert the new expense row — links to the user and the category found above
    const expense = await prisma.expense.create({
      data: {
        userId,
        vendorName: description,
        amount,
        expenseDate: new Date(date),
        categoryId: categoryRecord.categoryId,
      },
    })
    console.log('Created expense:', expense)

    for (const tagName of tags as string[]) {
      // DB CALL: look up this tag for the user — reuse it if found, create it if new
      let tag = await prisma.tag.findFirst({ where: { userId, tagName } })
      if (!tag) {
        tag = await prisma.tag.create({
          data: { userId, tagName, tagType: 'custom' },
        })
      }
      // DB CALL: link the tag to this expense in the join table (ExpenseTag)
      await prisma.expenseTag.create({
        data: { expenseId: expense.expenseId, tagId: tag.tagId },
      })
    }

    return apiResponse({ id: String(expense.expenseId) }, 201)
  } catch (error) {
    console.error('Expense creation error:', error)
    return handleApiError(error)
  }
}
