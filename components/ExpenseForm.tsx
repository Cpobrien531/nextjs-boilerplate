'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  color: string
}

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string
  tags: string[]
}

export function ExpenseForm() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    description: '',
    location: '',
    isBillable: false,
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        setCategories(data.data)
        if (data.data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data.data[0].id }))
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const handleAISuggest = async () => {
    if (!formData.name) {
      alert('Please enter an expense name')
      return
    }

    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseName: formData.name,
          description: formData.description,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSuggestedCategory(data.data.suggestedCategory)
        if (data.data.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.data.categoryId }))
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (res.ok) {
        alert('Expense created successfully!')
        setFormData({
          name: '',
          amount: '',
          expenseDate: new Date().toISOString().split('T')[0],
          categoryId: categories[0]?.id || '',
          description: '',
          location: '',
          isBillable: false,
        })
        setSuggestedCategory(null)
        router.refresh()
      } else {
        alert('Error creating expense')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Add Expense</h2>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Expense Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          required
        />
        <button
          type="button"
          onClick={handleAISuggest}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Get AI Suggestion
        </button>
        {suggestedCategory && (
          <p className="text-sm text-green-600 mt-1">AI suggests: {suggestedCategory}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Date *</label>
          <input
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Category *</label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          rows={3}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isBillable}
            onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
            className="mr-2"
          />
          <span className="text-gray-700">Billable</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Add Expense'}
      </button>
    </form>
  )
}

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch('/api/expenses')
        const data = await res.json()
        setExpenses(data.data)
      } catch (error) {
        console.error('Error fetching expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Loading expenses...</div>
  }

  return (
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
                <button className="text-blue-500 hover:text-blue-700 mr-4">Edit</button>
                <button className="text-red-500 hover:text-red-700">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
