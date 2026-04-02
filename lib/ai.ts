import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function categorizeExpense(
  expenseName: string,
  description?: string,
  categories?: string[],
): Promise<{ category: string; confidence: number }> {
  try {
    const defaultCategories = [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Utilities',
      'Healthcare',
      'Fitness',
      'Education',
      'Travel',
      'Business',
      'Personal Care',
      'Home & Garden',
      'Other',
    ]

    const categoriesToUse = categories && categories.length > 0 ? categories : defaultCategories

    const message = `Categorize this expense into one of the following categories: ${categoriesToUse.join(', ')}.

Expense Name: ${expenseName}
${description ? `Description: ${description}` : ''}

Respond ONLY with a valid JSON object in this exact format:
{
  "category": "category name",
  "confidence": 0.95
}

The confidence should be a number between 0 and 1 indicating how confident you are in this categorization.`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    })

    let responseText = ''
    if (response.choices[0].message && 'content' in response.choices[0].message) {
      responseText = response.choices[0].message.content || ''
    }

    // Clean up the response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?|\n?```/g, '').trim()

    const result = JSON.parse(responseText)

    return {
      category: result.category,
      confidence: result.confidence,
    }
  } catch (error) {
    console.error('Error categorizing expense:', error)
    throw new Error('Failed to categorize expense')
  }
}

export async function generateBudgetSummary(
  expenses: Array<{
    name: string
    amount: number
    category: string
  }>,
): Promise<string> {
  try {
    const expenseList = expenses.map((e) => `- ${e.name}: $${e.amount.toFixed(2)} (${e.category})`).join('\n')

    const message = `Analyze these expenses and provide a brief summary with spending insights:

${expenseList}

Provide a concise summary (2-3 sentences) highlighting spending patterns and recommendations.`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    })

    if (response.choices[0].message && 'content' in response.choices[0].message) {
      return response.choices[0].message.content || 'Unable to generate summary'
    }

    return 'Unable to generate summary'
  } catch (error) {
    console.error('Error generating budget summary:', error)
    throw new Error('Failed to generate budget summary')
  }
}
