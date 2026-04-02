"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Trash2, Filter, Receipt, Tag, Edit2 } from "lucide-react";
import { Expense } from "./expense-form";
import { ExpenseEditDialog } from "./expense-edit-dialog";

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  customCategories?: string[];
  title?: string;
  limitSelector?: ReactNode;
}

const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Other",
];

export function ExpenseList({ expenses, onDeleteExpense, onEditExpense, customCategories = [], title = "Expense History", limitSelector }: ExpenseListProps) {
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterTag, setFilterTag] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const allCategories = ["All", ...new Set([...DEFAULT_CATEGORIES, ...customCategories])];

  // Get all unique tags from expenses
  const allTags = Array.from(
    new Set(expenses.flatMap((expense) => expense.tags || []))
  ).sort();

  const filteredExpenses = expenses.filter((expense) => {
    const categoryMatch =
      filterCategory === "All" || expense.category === filterCategory;
    const tagMatch =
      filterTag === "All" || (expense.tags || []).includes(filterTag);
    return categoryMatch && tagMatch;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return b.amount - a.amount;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {title}
          </span>
          {limitSelector}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "amount")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterTag !== "All" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              <Badge variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {filterTag}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterTag("All")}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {sortedExpenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No expenses found</p>
            <p className="text-sm">Add your first expense to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{expense.description}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {expense.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                      {expense.tags && expense.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expense.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs px-2 py-0 h-5"
                            >
                              <Tag className="h-2.5 w-2.5 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold whitespace-nowrap">
                        ${expense.amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingExpense(expense)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log('Delete button clicked for expense:', expense.id);
                          onDeleteExpense(expense.id);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {editingExpense && (
        <ExpenseEditDialog
          open={!!editingExpense}
          expense={editingExpense}
          onSave={(updatedExpense) => {
            onEditExpense(updatedExpense);
            setEditingExpense(null);
          }}
          onClose={() => setEditingExpense(null)}
          customCategories={customCategories}
        />
      )}
      </CardContent>
    </Card>
  );
}
