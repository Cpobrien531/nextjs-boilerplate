import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagInput } from '@/components/tag-input'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
}))

describe('TagInput', () => {
  const mockOnTagsChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with initial tags', () => {
    const initialTags = ['work', 'urgent']
    render(<TagInput tags={initialTags} onTagsChange={mockOnTagsChange} />)

    expect(screen.getByText('work')).toBeInTheDocument()
    expect(screen.getByText('urgent')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('')).toBeInTheDocument()
  })

  it('renders placeholder when no tags', () => {
    render(<TagInput tags={[]} onTagsChange={mockOnTagsChange} />)

    expect(screen.getByPlaceholderText('Add tags (press Enter)')).toBeInTheDocument()
  })

  it('adds tag on Enter key press', async () => {
    const user = userEvent.setup()
    render(<TagInput tags={[]} onTagsChange={mockOnTagsChange} />)

    const input = screen.getByPlaceholderText('Add tags (press Enter)')
    await user.type(input, 'newtag')
    await user.keyboard('{Enter}')

    expect(mockOnTagsChange).toHaveBeenCalledWith(['newtag'])
  })

  it('does not add empty tag', async () => {
    const user = userEvent.setup()
    render(<TagInput tags={[]} onTagsChange={mockOnTagsChange} />)

    const input = screen.getByPlaceholderText('Add tags (press Enter)')
    await user.type(input, '   ')
    await user.keyboard('{Enter}')

    expect(mockOnTagsChange).not.toHaveBeenCalled()
  })

  it('does not add duplicate tag', async () => {
    const user = userEvent.setup()
    render(<TagInput tags={['existing']} onTagsChange={mockOnTagsChange} />)

    const input = screen.getByPlaceholderText('')
    await user.type(input, 'existing')
    await user.keyboard('{Enter}')

    expect(mockOnTagsChange).not.toHaveBeenCalled()
  })

  it('adds tag on blur', async () => {
    const user = userEvent.setup()
    render(<TagInput tags={[]} onTagsChange={mockOnTagsChange} />)

    const input = screen.getByPlaceholderText('Add tags (press Enter)')
    await user.type(input, 'blurred-tag')
    await user.click(document.body) // Trigger blur

    expect(mockOnTagsChange).toHaveBeenCalledWith(['blurred-tag'])
  })

  it('removes tag when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<TagInput tags={['tag1', 'tag2']} onTagsChange={mockOnTagsChange} />)

    const removeButtons = screen.getAllByTestId('x-icon')
    await user.click(removeButtons[0].parentElement!) // Click the button containing the X icon

    expect(mockOnTagsChange).toHaveBeenCalledWith(['tag2'])
  })

  it('removes last tag on backspace when input is empty', async () => {
    const user = userEvent.setup()
    render(<TagInput tags={['tag1', 'tag2']} onTagsChange={mockOnTagsChange} />)

    const input = screen.getByPlaceholderText('')
    await user.click(input)
    await user.keyboard('{Backspace}')

    expect(mockOnTagsChange).toHaveBeenCalledWith(['tag1'])
  })

  it('clears input after adding tag', async () => {
    const user = userEvent.setup()
    render(<TagInput tags={[]} onTagsChange={mockOnTagsChange} />)

    const input = screen.getByPlaceholderText('Add tags (press Enter)')
    await user.type(input, 'test-tag')
    await user.keyboard('{Enter}')

    expect(input).toHaveValue('')
  })

  it('shows help text', () => {
    render(<TagInput tags={[]} onTagsChange={mockOnTagsChange} />)

    expect(screen.getByText('Press Enter to add a tag. Examples: work, personal, urgent, recurring')).toBeInTheDocument()
  })
})