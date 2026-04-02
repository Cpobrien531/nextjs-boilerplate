"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlusCircle } from "lucide-react";
import { ReceiptScanner } from "./receipt-scanner";
import { Separator } from "./ui/separator";
import { TagInput } from "./tag-input";
import { CategorySelect } from "./category-select";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  tags: string[];
}

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
  customCategories: string[];
  onAddCustomCategory: (category: string) => void;
  onDeleteCustomCategory?: (category: string) => void;
}

export function ExpenseForm({ onAddExpense, customCategories, onAddCustomCategory, onDeleteCustomCategory }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState<string[]>([]);

  const handleScanComplete = (result: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => {
    setAmount(result.amount.toString());
    setDescription(result.description);
    setCategory(result.category);
    setDate(result.date);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description || !category) {
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      date,
      tags,
    };

    onAddExpense(expense);

    // Reset form
    setAmount("");
    setDescription("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setTags([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Add New Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ReceiptScanner onScanComplete={handleScanComplete} />
          
          <div className="flex items-center gap-4 my-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">or enter manually</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
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
              placeholder="Enter expense description"
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
            onDeleteCustomCategory={onDeleteCustomCategory}
          />

          <TagInput tags={tags} onTagsChange={setTags} />

          <Button type="submit" className="w-full">
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
