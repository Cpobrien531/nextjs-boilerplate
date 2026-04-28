import { render, screen } from '@testing-library/react'
import { ExpenseStats } from '@/components/expense-stats'
import { Expense } from '@/components/expense-form'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
}))

describe('ExpenseStats', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      amount: 25.50,
      description: 'Lunch at restaurant',
      category: 'Food & Dining',
      date: '2024-01-15',
      tags: ['lunch'],
    },
    {
      id: '2',
      amount: 10.00,
      description: 'Coffee',
      category: 'Food & Dining',
      date: '2024-01-16',
      tags: ['coffee'],
    },
    {
      id: '3',
      amount: 45.00,
      description: 'Gas',
      category: 'Transportation',
      date: '2024-01-17',
      tags: ['car'],
    },
  ]

  it('renders expense statistics correctly', () => {
    render(<ExpenseStats expenses={mockExpenses} />)

    // Check total expenses
    expect(screen.getByText('$80.50')).toBeInTheDocument()
    expect(screen.getByText('3 transactions')).toBeInTheDocument()

    // Check average
    expect(screen.getByText('$26.83')).toBeInTheDocument()
    expect(screen.getByText('Per transaction')).toBeInTheDocument()

    // Check categories
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('$35.50')).toBeInTheDocument()
    expect(screen.getByText('44.1% of total')).toBeInTheDocument()

    expect(screen.getByText('Transportation')).toBeInTheDocument()
    expect(screen.getByText('$45.00')).toBeInTheDocument()
    expect(screen.getByText('55.9% of total')).toBeInTheDocument()
  })

  it('renders empty state correctly', () => {
    render(<ExpenseStats expenses={[]} />)

    expect(screen.getByText('0 transactions')).toBeInTheDocument()
    expect(screen.getAllByText('$0.00')).toHaveLength(3) // Total, This Month, Average all show $0.00
  })

  it('filters expenses for current month', () => {
    // Mock current date to be January 2024
    const mockDate = new Date('2024-01-15')
    jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('January 2024')
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(0) // January
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024)

    const mixedExpenses: Expense[] = [
      ...mockExpenses,
      {
        id: '4',
        amount: 100.00,
        description: 'Old expense',
        category: 'Other',
        date: '2023-12-15', // Previous month
        tags: [],
      },
    ]

    render(<ExpenseStats expenses={mixedExpenses} />)

    // Should show January 2024 in the "This Month" card
    expect(screen.getByText('January 2024')).toBeInTheDocument()

    // Restore original Date methods
    jest.restoreAllMocks()
  })

  it('calculates category percentages correctly', () => {
    const singleCategoryExpenses: Expense[] = [
      {
        id: '1',
        amount: 100.00,
        description: 'Test',
        category: 'Test Category',
        date: '2024-01-15',
        tags: [],
      },
    ]

    render(<ExpenseStats expenses={singleCategoryExpenses} />)

    expect(screen.getByText('100.0% of total')).toBeInTheDocument()
  })

  it('sorts categories by amount descending', () => {
    const unsortedExpenses: Expense[] = [
      {
        id: '1',
        amount: 10.00,
        description: 'Small expense',
        category: 'Small',
        date: '2024-01-15',
        tags: [],
      },
      {
        id: '2',
        amount: 50.00,
        description: 'Large expense',
        category: 'Large',
        date: '2024-01-15',
        tags: [],
      },
      {
        id: '3',
        amount: 30.00,
        description: 'Medium expense',
        category: 'Medium',
        date: '2024-01-15',
        tags: [],
      },
    ]

    render(<ExpenseStats expenses={unsortedExpenses} />)

    const categoryElements = screen.getAllByText(/Large|Medium|Small/)
    expect(categoryElements[0]).toHaveTextContent('Large')
    expect(categoryElements[1]).toHaveTextContent('Medium')
    expect(categoryElements[2]).toHaveTextContent('Small')
  })
})