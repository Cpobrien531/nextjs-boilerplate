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
import { PlusCircle, Check, X } from "lucide-react";
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
  onDeleteCustomCategory?: (category: string) => void;
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
  onDeleteCustomCategory,
}: CategorySelectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...customCategories])];

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
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
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
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Add new categories or delete existing ones. Note: Categories with expenses cannot be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-category">Add Category Name</Label>
              <Input
                id="new-category"
                placeholder="e.g., Pet Care, Subscriptions, Gifts"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            {allCategories.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">All Categories ({allCategories.length}):</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-muted rounded">
                  {allCategories.map((cat) => (
                    <div
                      key={cat}
                      className="text-xs px-2 py-1 bg-secondary rounded-md flex items-center gap-2"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onDeleteCustomCategory) {
                            onDeleteCustomCategory(cat);
                          }
                        }}
                        className="hover:bg-destructive/20 rounded p-0.5 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <X className="h-3 w-3" />
                      </button>
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
