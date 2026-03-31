"use client";

import { useState, useEffect } from "react";
import { ExpenseForm, Expense } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { ExpenseStats } from "@/components/expense-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign } from "lucide-react";

const STORAGE_KEY = "expense-tracker-data";
const CUSTOM_CATEGORIES_KEY = "expense-tracker-custom-categories";

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error("Failed to parse stored expenses:", error);
          return [];
        }
      }
    }
    return [];
  });
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedCategories = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (storedCategories) {
        try {
          return JSON.parse(storedCategories);
        } catch (error) {
          console.error("Failed to parse stored categories:", error);
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const handleAddCustomCategory = (category: string) => {
    if (!customCategories.includes(category)) {
      setCustomCategories((prev) => [...prev, category]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Expense Tracker</h1>
          </div>
          <p className="text-muted-foreground">
            Track your expenses and manage your budget effectively
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="add">Add Expense</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ExpenseStats expenses={expenses} />
            {expenses.length > 0 && (
              <ExpenseList
                expenses={expenses.slice(0, 5)}
                onDeleteExpense={handleDeleteExpense}
                customCategories={customCategories}
              />
            )}
          </TabsContent>

          <TabsContent value="add">
            <ExpenseForm
              onAddExpense={handleAddExpense}
              customCategories={customCategories}
              onAddCustomCategory={handleAddCustomCategory}
            />
          </TabsContent>

          <TabsContent value="history">
            <ExpenseList
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              customCategories={customCategories}
            />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}