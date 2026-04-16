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
    const res = await fetch("/api/expenses");
    const json = await res.json();
    if (json.success) setExpenses(json.data);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    if (json.success) {
      setCustomCategories(json.data as string[]);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses();
      fetchCategories();
    }
  }, [status, fetchExpenses, fetchCategories]);

  const handleAddExpense = async (expense: Expense) => {
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    await fetchExpenses();
  };

  const handleDeleteExpense = async (id: string) => {
    console.log('handleDeleteExpense called with id:', id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await fetchExpenses();
  };

  const handleEditExpense = async (expense: Expense) => {
    await fetch(`/api/expenses/${expense.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    await fetchExpenses();
  };

  const handleAddCustomCategory = async (category: string) => {
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: category }),
    });
    setCustomCategories((prev) =>
      prev.includes(category) ? prev : [...prev, category]
    );
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
