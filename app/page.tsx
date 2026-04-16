"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ExpenseForm, Expense } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { ExpenseStats } from "@/components/expense-stats";
import { QuickAddExpenseDialog } from "@/components/quick-add-expense-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, LogOut, PiggyBank, FileDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [recentLimit, setRecentLimit] = useState(5);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses");
      const json = await res.json();
      if (json.success) {
        console.log('Fetched expenses:', json.data);
        setExpenses(json.data);
      } else {
        console.error('Failed to fetch expenses:', json.error);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        console.log('Fetched categories:', json.data);
        setCustomCategories(json.data as string[]);
      } else {
        console.error('Failed to fetch categories:', json.error);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses();
      fetchCategories();
    }
  }, [status, fetchExpenses, fetchCategories]);

  const handleAddExpense = async (expense: Expense) => {
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });

      const data = await response.json();
      if (data.success) {
        console.log('Expense added successfully:', data);
        await fetchExpenses();
      } else {
        console.error('Failed to add expense:', data.error);
        alert(`Failed to add expense: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    console.log('handleDeleteExpense called with id:', id);
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        console.log('Expense deleted successfully');
        await fetchExpenses();
      } else {
        console.error('Failed to delete expense:', data.error);
        alert(`Failed to delete expense: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense. Please try again.');
    }
  };

  const handleEditExpense = async (expense: Expense) => {
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      const data = await response.json();
      if (data.success) {
        console.log('Expense updated successfully');
        await fetchExpenses();
      } else {
        console.error('Failed to update expense:', data.error);
        alert(`Failed to update expense: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error updating expense. Please try again.');
    }
  };

  const handleAddCustomCategory = async (category: string) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: category }),
      });
      const data = await response.json();
      if (data.success) {
        setCustomCategories((prev) =>
          prev.includes(category) ? prev : [...prev, category]
        );
      } else {
        console.error('Failed to add category:', data.error);
        alert(`Failed to add category: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
    }
  };

  const handleDeleteCustomCategory = async (category: string) => {
    try {
      const response = await fetch(`/api/categories?name=${encodeURIComponent(category)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setCustomCategories((prev) => prev.filter((c) => c !== category));
      } else {
        console.error('Failed to delete category:', data.error);
        alert(`Failed to delete category: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category. Please try again.');
    }
  };

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-lg">
                <DollarSign className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold">Expense Tracker</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome, {session?.user?.name}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <Button
              onClick={() => setShowQuickAdd(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>
            <Link
              href="/budget"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <PiggyBank className="h-4 w-4" />
              Budget
            </Link>
            <Link
              href="/export"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Export
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
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
                expenses={expenses.slice(0, recentLimit)}
                onDeleteExpense={handleDeleteExpense}
                onEditExpense={handleEditExpense}
                customCategories={customCategories}
                title="Recent Expenses"
                limitSelector={
                  <select
                    value={recentLimit}
                    onChange={(e) => setRecentLimit(Number(e.target.value))}
                    className="text-sm border border-input rounded px-2 py-1 bg-background"
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>Last {n}</option>
                    ))}
                  </select>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="add">
            <ExpenseForm
              onAddExpense={handleAddExpense}
              customCategories={customCategories}
              onAddCustomCategory={handleAddCustomCategory}
              onCategoriesChange={fetchCategories}
            />
          </TabsContent>

          <TabsContent value="history">
            <ExpenseList
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleEditExpense}
              customCategories={customCategories}
            />
          </TabsContent>
        </Tabs>

        <QuickAddExpenseDialog
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          onAddExpense={handleAddExpense}
          customCategories={customCategories}
          onAddCustomCategory={handleAddCustomCategory}
        />
      </div>
    </div>
  );
}
