'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2, ChevronLeft, ChevronRight, PlusCircle, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BudgetEntry {
  budgetId: number
  categoryId: number
  categoryName: string
  month: number
  year: number
  budgetAmount: number
  amountSpent: number
}

export default function BudgetPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const now = new Date()
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [year, setYear] = useState<number>(now.getFullYear())
  const [budgets, setBudgets] = useState<BudgetEntry[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [editingCategory, setEditingCategory] = useState<string>('')
  const [editingAmount, setEditingAmount] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchBudgets = useCallback(async () => {
    const res = await fetch(`/api/budgets?month=${month}&year=${year}`)
    const json = await res.json()
    if (json.success) setBudgets(json.data)
  }, [month, year])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories')
    const json = await res.json()
    if (json.success) {
      const names: string[] = json.data as string[]
      setCategories(names)
      if (names.length > 0) setEditingCategory(names[0])
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBudgets()
    }
  }, [fetchBudgets, status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategories()
    }
  }, [fetchCategories, status])

  function prevMonth() {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  async function handleSetBudget() {
    if (!editingCategory || !editingAmount) return
    const amount = parseFloat(editingAmount)
    if (isNaN(amount) || amount <= 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: editingCategory,
          month,
          year,
          budgetAmount: amount,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setEditingAmount('')
        await fetchBudgets()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(budgetId: number) {
    const res = await fetch(`/api/budgets/${budgetId}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      setBudgets((prev) => prev.filter((b) => b.budgetId !== budgetId))
    }
  }

  async function handleAddCategory() {
    const trimmed = newCategory.trim()
    if (!trimmed) return

    setIsAddingCategory(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Category "${trimmed}" added successfully!`)
        await fetchCategories()
        setEditingCategory(trimmed)
        setNewCategory('')
        setIsDialogOpen(false)
      }
    } catch (error) {
      toast.error('Failed to add category')
    } finally {
      setIsAddingCategory(false)
    }
  }

  async function handleDeleteCategory(categoryName: string) {
    try {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Category deleted successfully!')
        await fetchCategories()
      } else {
        const errorMsg = json.message || json.error || 'Failed to delete category'
        toast.error(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete category'
      toast.error(errorMsg)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCategory()
    }
  }

  function progressColor(pct: number): string {
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 75) return 'bg-yellow-400'
    return 'bg-green-500'
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return null
  }

  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Home
            </Link>
            <h1 className="text-2xl font-bold">Budget Planner</h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Month / Year selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold w-40 text-center">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Set Budget form */}
        <div className="flex gap-2 mb-8">
          <select
            value={editingCategory}
            onChange={(e) => setEditingCategory(e.target.value)}
            className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
            title="Add new category"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={editingAmount}
            onChange={(e) => setEditingAmount(e.target.value)}
            className="w-32 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSetBudget}
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Set Budget
          </button>
        </div>

        {/* Budget cards */}
        {budgets.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            No budgets set for {monthLabel}.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {budgets.map((b) => {
              const pct = Math.min((b.amountSpent / b.budgetAmount) * 100, 100)
              const remaining = b.budgetAmount - b.amountSpent
              const isOver = b.amountSpent > b.budgetAmount

              return (
                <div
                  key={b.budgetId}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{b.categoryName}</span>
                    <button
                      onClick={() => handleDelete(b.budgetId)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`Delete budget for ${b.categoryName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      ${b.amountSpent.toFixed(2)} spent of ${b.budgetAmount.toFixed(2)}
                    </span>
                    <span className={isOver ? 'text-red-500 font-medium' : ''}>
                      {isOver
                        ? `Over by $${Math.abs(remaining).toFixed(2)}`
                        : `$${remaining.toFixed(2)} remaining`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Category Management Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Manage Categories</h2>
                <p className="text-sm text-muted-foreground">Add new categories or delete existing ones.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add Category Name</label>
                <input
                  type="text"
                  placeholder="e.g., Pet Care, Subscriptions"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">All Categories ({categories.length}):</p>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-muted rounded">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        className="text-xs px-2 py-1 bg-secondary rounded-md flex items-center gap-2"
                      >
                        <span>{cat}</span>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="hover:bg-destructive/20 rounded p-0.5 transition-colors"
                          title="Delete category"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsDialogOpen(false)
                    setNewCategory('')
                  }}
                  className="px-4 py-2 rounded-md border border-border hover:bg-accent transition-colors text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={isAddingCategory || !newCategory.trim()}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isAddingCategory ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
