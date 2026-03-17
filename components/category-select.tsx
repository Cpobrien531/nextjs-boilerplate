"use client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PlusCircle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  customCategories: string[];
  onAddCustomCategory: (category: string) => void;
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

export function CategorySelect({
  value,
  onValueChange,
  customCategories,
  onAddCustomCategory,
}: CategorySelectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !allCategories.includes(trimmed)) {
      onAddCustomCategory(trimmed);
      onValueChange(trimmed);
      setNewCategory("");
      setIsDialogOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCategory();
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <div className="flex gap-2">
          <Select value={value} onValueChange={onValueChange} required>
            <SelectTrigger id="category" className="flex-1">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
              {customCategories.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Custom Categories
                  </div>
                  {customCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            title="Add custom category"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Category</DialogTitle>
            <DialogDescription>
              Create a new category for your expenses. This will be saved and
              available for future use.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-category">Category Name</Label>
              <Input
                id="new-category"
                placeholder="e.g., Pet Care, Subscriptions, Gifts"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            {customCategories.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Your Custom Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {customCategories.map((cat) => (
                    <div
                      key={cat}
                      className="text-xs px-2 py-1 bg-secondary rounded-md"
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewCategory("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
