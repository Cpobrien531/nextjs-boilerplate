"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Expense } from "./expense-form";
import { CategorySelect } from "./category-select";
import { TagInput } from "./tag-input";

interface ExpenseEditDialogProps {
  expense: Expense;
  onSave: (expense: Expense) => void;
  onClose: () => void;
  customCategories: string[];
  open: boolean;
}

export function ExpenseEditDialog({
  expense,
  onSave,
  onClose,
  customCategories,
  open,
}: ExpenseEditDialogProps) {
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(expense.date);
  const [tags, setTags] = useState<string[]>(expense.tags || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || !description || !category) return;

    setSaving(true);
    try {
      const updatedExpense: Expense = {
        id: expense.id,
        amount: parseFloat(amount),
        description,
        category,
        date,
        tags,
      };

      onSave(updatedExpense);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Make changes to your expense details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <CategorySelect
            value={category}
            onValueChange={setCategory}
            customCategories={customCategories}
            onAddCustomCategory={() => {}}
          />

          <TagInput tags={tags} onTagsChange={setTags} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
