'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/Dashboard'

interface Category {
  id: string
  name: string
  icon?: string
  color: string
  monthlyBudget: number
  currentMonthSpent: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    color: '#808080',
    monthlyBudget: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          color: formData.color,
          monthlyBudget: parseFloat(formData.monthlyBudget || '0'),
        }),
      })

      if (res.ok) {
        alert('Category created successfully!')
        setFormData({ name: '', color: '#808080', monthlyBudget: '' })
        setShowForm(false)
        fetchCategories()
      } else {
        alert('Error creating category')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating category')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          alert('Category deleted successfully!')
          fetchCategories()
        } else {
          alert('Error deleting category')
        }
      } catch (error) {
        console.error('Error:', error)
        alert('Error deleting category')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Categories</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showForm ? 'Cancel' : 'Add Category'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded h-10"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Monthly Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Category
            </button>
          </form>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow p-6 border-t-4"
                style={{ borderTopColor: category.color }}
              >
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                {category.monthlyBudget > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Budget</span>
                      <span>
                        ${category.currentMonthSpent.toFixed(2)} / $
                        {category.monthlyBudget.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (category.currentMonthSpent / category.monthlyBudget) * 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
