"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Expense } from "./expense-form";

interface QuickAddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddExpense: (expense: Expense) => void;
  customCategories: string[];
  onAddCustomCategory: (category: string) => void;
}

export function QuickAddExpenseDialog({
  open,
  onOpenChange,
  onAddExpense,
}: QuickAddExpenseDialogProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setSubmitting(true);
    try {
      // Fetch AI category at submit time
      let category = "Other";
      try {
        const res = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expenseName: description }),
        });
        const data = await res.json();
        if (data.success && data.data.suggestedCategory) {
          category = data.data.suggestedCategory;
        }
      } catch {
        // fall back to "Other"
      }

      const expense: Expense = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        description,
        category,
        date: new Date().toISOString().split("T")[0],
        tags: [],
      };

      onAddExpense(expense);

      setAmount("");
      setDescription("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Quick Add Expense</DialogTitle>
          <DialogDescription>
            AI will automatically categorize your expense.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quick-description">Description *</Label>
            <Input
              id="quick-description"
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-amount">Amount ($) *</Label>
            <Input
              id="quick-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !amount || !description}>
              {submitting ? "Categorizing & Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
