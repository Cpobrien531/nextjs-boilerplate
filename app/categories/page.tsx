'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/Dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, Edit2 } from 'lucide-react'

interface Category {
  categoryId: string | number
  categoryName: string
  categoryDescription?: string
}

interface EditFormData {
  categoryName: string
  categoryDescription?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    categoryName: '',
    categoryDescription: '',
  })
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    categoryName: '',
    categoryDescription: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?full=true')
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
          name: formData.categoryName,
          description: formData.categoryDescription,
        }),
      })

      if (res.ok) {
        setFormData({ categoryName: '', categoryDescription: '' })
        setShowForm(false)
        await fetchCategories()
      } else {
        alert('Error creating category')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating category')
    }
  }

  const handleStartEdit = (category: Category) => {
    setEditingId(category.categoryId)
    setEditFormData({
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription || '',
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    try {
      const res = await fetch(`/api/categories/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      if (res.ok) {
        setEditingId(null)
        await fetchCategories()
      } else {
        alert('Error updating category')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating category')
    }
  }

  const handleDelete = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          await fetchCategories()
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
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
          >
            {showForm ? 'Cancel' : '+ Add Category'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="mb-4">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.categoryName}
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={formData.categoryDescription}
                onChange={(e) => setFormData({ ...formData, categoryDescription: e.target.value })}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
            >
              Create Category
            </Button>
          </form>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.categoryId}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-bold mb-2">{category.categoryName}</h3>
                {category.categoryDescription && (
                  <p className="text-sm text-gray-600 mb-4">{category.categoryDescription}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEdit(category)}
                    className="gap-1"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(category.categoryId)}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category details below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editFormData.categoryName}
                  onChange={(e) => setEditFormData({ ...editFormData, categoryName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  type="text"
                  value={editFormData.categoryDescription || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, categoryDescription: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
