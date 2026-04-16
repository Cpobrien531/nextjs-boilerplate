import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function categorizeExpense(
  expenseName: string,
  description?: string,
  categories?: string[],
): Promise<{ category: string; confidence: number }> {
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

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [{ role: 'user', content: message }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Failed to categorize expense')
  }

  const cleaned = textBlock.text.replace(/```json\n?|\n?```/g, '').trim()
  const result = JSON.parse(cleaned)

  return {
    category: result.category,
    confidence: result.confidence,
  }
}

export async function generateBudgetSummary(
  expenses: Array<{
    name: string
    amount: number
    category: string
  }>,
): Promise<string> {
  const expenseList = expenses
    .map((e) => `- ${e.name}: $${e.amount.toFixed(2)} (${e.category})`)
    .join('\n')

  const message = `Analyze these expenses and provide a brief summary with spending insights:

${expenseList}

Provide a concise summary (2-3 sentences) highlighting spending patterns and recommendations.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: message }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text : 'Unable to generate summary'
}
