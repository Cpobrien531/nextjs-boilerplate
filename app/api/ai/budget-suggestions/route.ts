import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiResponse, apiError, handleApiError } from '@/lib/api'
import OpenAI from 'openai'

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const userId = parseInt(session.user.id)
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
      ? parseInt(searchParams.get('categoryId')!)
      : null

    const today = new Date()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    // Get last 6 months of budget and spending data for analysis
    const analysisData = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(year, month - 1 - i, 1)
      const analysisMonth = date.getMonth() + 1
      const analysisYear = date.getFullYear()

      const where = categoryId
        ? {
            userId,
            categoryId,
            month: analysisMonth,
            year: analysisYear,
          }
        : {
            userId,
            month: analysisMonth,
            year: analysisYear,
          }

      const budgets = await prisma.budget.findMany({
        where,
        include: { category: true },
      })

      for (const budget of budgets) {
        const expenses = await prisma.expense.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            expenseDate: {
              gte: new Date(analysisYear, analysisMonth - 1, 1),
              lte: new Date(analysisYear, analysisMonth, 0),
            },
          },
          _sum: { amount: true },
        })

        const spent = Number(expenses._sum.amount || 0)
        const budgetAmount = Number(budget.budgetAmount)

        analysisData.push({
          category: budget.category.categoryName,
          month: analysisMonth,
          year: analysisYear,
          budget: budgetAmount,
          spent,
          percentage: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
        })
      }
    }

    if (analysisData.length === 0) {
      return apiResponse({
        suggestions: [],
        message: 'Not enough data for budget suggestions. Please check back after a few months of expense tracking.',
      })
    }

    // Use OpenAI to analyze spending patterns and suggest changes
    const analysisPrompt = `Analyze the following 6 months of budget and spending data for expense categories. For each category, suggest whether the budget should be increased, decreased, or kept the same for the next month. Consider:
- Consistently high spending relative to budget (>90% spent)
- Consistently low spending relative to budget (<50% spent)
- Fluctuating spending patterns
- Average spending trends

Data in JSON format:
${JSON.stringify(analysisData, null, 2)}

Respond with a JSON array of suggestions, each with: category (string), recommendation ("increase" | "decrease" | "keep"), reasoning (string), suggestedBudget (number). If no suggestion is needed for a category, omit it from the response.`

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
    })

    let suggestions = []
    try {
      const responseText =
        completion.choices[0].message.content || '[]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If parsing fails, return empty suggestions
      suggestions = []
    }

    return apiResponse({
      suggestions,
      analysisMonths: 6,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
