'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
      </div>
    </div>
  )
}
