"use client";
import { useState, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlusCircle, Zap } from "lucide-react";
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
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getAutoSuggestion = useCallback(async (desc: string) => {
    if (!desc || desc.length < 3) {
      setSuggestedCategory(null);
      return;
    }

    setIsLoadingSuggestion(true);
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseName: desc }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestedCategory(data.suggestedCategory || null);
      }
    } catch {
      // Silently fail for auto-suggestions
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, []);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);

    // Debounce the API call
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    suggestionTimeoutRef.current = setTimeout(() => {
      getAutoSuggestion(value);
    }, 500);
  };

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

  const handleAcceptSuggestion = () => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setSuggestedCategory(null);
    }
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
    setSuggestedCategory(null);
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
            <div className="relative">
              <Input
                id="description"
                type="text"
                placeholder="Enter expense description"
                value={description}
                onChange={handleDescriptionChange}
                required
              />
              {suggestedCategory && !category && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleAcceptSuggestion}
                    className="gap-1 text-xs"
                    title={`Apply suggested category: ${suggestedCategory}`}
                  >
                    <Zap className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            {isLoadingSuggestion && (
              <p className="text-xs text-muted-foreground">Searching your past expenses...</p>
            )}
            {suggestedCategory && !category && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Suggested category: <strong>{suggestedCategory}</strong>
              </p>
            )}
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
