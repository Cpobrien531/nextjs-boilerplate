'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Expense } from '@/lib/types'

interface DashboardStats {
  totalSpent: number
  categoryCount: number
  expenseCount: number
  thisMonth: number
}

export function DashboardHeader() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [expensesRes, categoriesRes] = await Promise.all([
          fetch('/api/expenses'),
          fetch('/api/categories'),
        ])

        const expensesData = await expensesRes.json()
        const categoriesData = await categoriesRes.json()

        const expenses = expensesData.data.expenses
        const categories = categoriesData.data

        const today = new Date()
        const thisMonth = expenses
          .filter((e: Expense) => {
            const expenseDate = new Date(e.expenseDate)
            return (
              expenseDate.getMonth() === today.getMonth() &&
              expenseDate.getFullYear() === today.getFullYear()
            )
          })
          .reduce((sum: number, e: Expense) => sum + e.amount, 0)

        const totalSpent = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0)

        setStats({
          totalSpent,
          categoryCount: categories.length,
          expenseCount: expenses.length,
          thisMonth,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">Total Spent</h3>
        <p className="text-3xl font-bold mt-2">${stats?.totalSpent.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">This Month</h3>
        <p className="text-3xl font-bold mt-2">${stats?.thisMonth.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">Categories</h3>
        <p className="text-3xl font-bold mt-2">{stats?.categoryCount}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">Expenses</h3>
        <p className="text-3xl font-bold mt-2">{stats?.expenseCount}</p>
      </div>
    </div>
  )
}

export function DashboardNav() {
  return (
    <nav className="bg-white shadow mb-8">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">AI Expense Tracker</h1>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/expenses"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Expenses
          </Link>
          <Link
            href="/categories"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Categories
          </Link>
          <Link
            href="/api/auth/signout"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </nav>
  )
}
