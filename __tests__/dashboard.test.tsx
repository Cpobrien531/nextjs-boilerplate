import { render, screen, waitFor, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import DashboardPage from '@/app/dashboard/page'

// Mock next/navigation
const mockPush = jest.fn((path) => console.log('router.push called with:', path))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock components
jest.mock('@/components/Dashboard', () => ({
  DashboardNav: () => <div data-testid="dashboard-nav">Dashboard Nav</div>,
  DashboardHeader: () => <div data-testid="dashboard-header">Dashboard Header</div>,
}))

jest.mock('@/components/ExpenseForm', () => ({
  ExpenseForm: () => <div data-testid="expense-form">Expense Form</div>,
  ExpenseList: () => <div data-testid="expense-list">Expense List</div>,
}))

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: [] }),
  })
)

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders dashboard when authenticated', async () => {
    // Mock fetch for DashboardHeader
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: {
            expenses: [
              { id: 1, amount: 50, expenseDate: '2024-01-15', category: 'Food' },
              { id: 2, amount: 25, expenseDate: '2024-01-20', category: 'Transport' }
            ]
          }
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: ['Food', 'Transport', 'Entertainment']
        })
      })

    render(<DashboardPage />)

    // Wait for the auth check to pass (mock it as successful)
    await act(async () => {
      // Simulate the auth check passing
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Mock the auth fetch to return success
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
    })

    // Re-render or wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    expect(screen.getByTestId('expense-form')).toBeInTheDocument()
    expect(screen.getByTestId('expense-list')).toBeInTheDocument()
    expect(screen.getByText('Recent Expenses')).toBeInTheDocument()
  })
})