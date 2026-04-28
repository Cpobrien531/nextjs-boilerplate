import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('LoginPage', () => {
  const mockRouter = { push: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)

    expect(screen.getByText('Expense Tracker')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true })

    render(<LoginPage />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0] // Email input
    const passwordInput = inputs[1] // Password input
    const submitButton = screen.getByRole('button', { name: 'Log In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })

    expect(submitButton).toHaveTextContent('Log In') // Should not be loading
  })

  it('handles login failure', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: false })

    render(<LoginPage />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0]
    const passwordInput = inputs[1]
    const submitButton = screen.getByRole('button', { name: 'Log In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    expect(submitButton).toHaveTextContent('Log In') // Should not be loading
  })

  it('shows loading state during login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)))

    render(<LoginPage />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0]
    const passwordInput = inputs[1]
    const submitButton = screen.getByRole('button', { name: 'Log In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(submitButton).toHaveTextContent('Logging in...')

    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Log In')
    })
  })

  it('prevents form submission with empty fields', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: 'Log In' })
    await user.click(submitButton)

    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('updates form data on input change', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0]
    const passwordInput = inputs[1]

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('clears error on new submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true })

    render(<LoginPage />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0]
    const passwordInput = inputs[1]
    const submitButton = screen.getByRole('button', { name: 'Log In' })

    // First failed attempt
    const emailInput1 = document.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput1 = document.querySelector('input[type="password"]') as HTMLInputElement
    await user.type(emailInput1, 'test@example.com')
    await user.type(passwordInput1, 'wrong')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    // Second successful attempt
    const emailInput2 = document.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput2 = document.querySelector('input[type="password"]') as HTMLInputElement
    await user.clear(emailInput2)
    await user.clear(passwordInput2)
    await user.type(emailInput2, 'test@example.com')
    await user.type(passwordInput2, 'correct')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
    })
  })
})