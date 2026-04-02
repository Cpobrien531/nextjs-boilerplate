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
import { CategorySelect } from "./category-select";

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
  customCategories,
  onAddCustomCategory,
}: QuickAddExpenseDialogProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description || !category) {
      return;
    }

    setSubmitting(true);
    try {
      const expense: Expense = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        description,
        category,
        date: new Date().toISOString().split("T")[0],
        tags: [],
      };

      onAddExpense(expense);

      // Reset form
      setAmount("");
      setDescription("");
      setCategory("");
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
            Quickly add an expense with the essential details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-description">Description *</Label>
            <Input
              id="quick-description"
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <CategorySelect
            value={category}
            onValueChange={setCategory}
            customCategories={customCategories}
            onAddCustomCategory={onAddCustomCategory}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !amount || !description || !category}>
              {submitting ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
