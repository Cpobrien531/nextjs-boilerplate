'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardNav, DashboardHeader } from '@/components/Dashboard'
import { ExpenseForm, ExpenseList } from '@/components/ExpenseForm'

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/expenses')
        if (res.status === 401) {
          router.push('/login')
        } else {
          setIsAuthenticated(true)
        }
      } catch (_error) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <DashboardHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ExpenseForm />
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Recent Expenses</h2>
            <ExpenseList />
          </div>
        </div>
      </div>
    </div>
  )
}
