'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardNav } from '@/components/Dashboard'

interface Category {
  id: string
  name: string
}

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string
  tags: string[]
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    categoryId: '',
    status: '',
  })

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.status) params.append('status', filters.status)

      const res = await fetch(`/api/expenses?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setExpenses(data.data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [filters, fetchExpenses])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
      } else {
        alert('Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error deleting expense')
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.categoryId) params.append('categoryId', filters.categoryId)

      const res = await fetch(`/api/export/csv?${params.toString()}`)
      const csv = await res.text()

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'expenses.csv'
      a.click()
    } catch (error) {
      console.error('Error exporting expenses:', error)
      alert('Error exporting expenses')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Expenses</h1>
          <button
            onClick={handleExport}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Export CSV
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Filter by Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) =>
                  setFilters({ ...filters, categoryId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Filter by Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SAVED">Saved</option>
                <option value="CATEGORIZED">Categorized</option>
                <option value="TAGGED">Tagged</option>
                <option value="EDITED">Edited</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">Loading expenses...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-900 font-medium">Date</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-medium">Name</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-medium">Category</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-medium">Amount</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">${expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-500 hover:text-blue-700 mr-4 text-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
