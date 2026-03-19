import { render, screen, act } from "@testing-library/react";
import Home from "@/app/page";
import { Expense } from "@/components/expense-form";

// ─── Mock child components to isolate page-level logic ────────────────────────

let capturedOnAddExpense: ((e: Expense) => void) | null = null;
let capturedOnDeleteExpense: ((id: string) => void) | null = null;
let capturedOnAddCustomCategory: ((c: string) => void) | null = null;

jest.mock("@/components/expense-form", () => ({
  ExpenseForm: (props: {
    onAddExpense: (e: Expense) => void;
    customCategories: string[];
    onAddCustomCategory: (c: string) => void;
  }) => {
    capturedOnAddExpense = props.onAddExpense;
    capturedOnAddCustomCategory = props.onAddCustomCategory;
    return (
      <div data-testid="expense-form">
        <span data-testid="custom-categories">
          {props.customCategories.join(",")}
        </span>
      </div>
    );
  },
}));

jest.mock("@/components/expense-list", () => ({
  ExpenseList: (props: {
    expenses: Expense[];
    onDeleteExpense: (id: string) => void;
    customCategories: string[];
  }) => {
    capturedOnDeleteExpense = props.onDeleteExpense;
    return (
      <div data-testid="expense-list">
        {props.expenses.map((e) => (
          <div key={e.id} data-testid={`expense-${e.id}`}>
            {e.description}
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock("@/components/expense-stats", () => ({
  ExpenseStats: ({ expenses }: { expenses: Expense[] }) => (
    <div data-testid="expense-stats">{expenses.length} expenses</div>
  ),
}));

// Render all tab content unconditionally so callbacks are always captured
jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ─── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = "expense-tracker-data";
const CATEGORIES_KEY = "expense-tracker-custom-categories";

function seedLocalStorage(expenses: Expense[], categories: string[] = []) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

const sampleExpense: Expense = {
  id: "e1",
  amount: 42,
  description: "Coffee",
  category: "Food & Dining",
  date: "2026-03-19",
  tags: [],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Home (page.tsx)", () => {
  beforeEach(() => {
    localStorage.clear();
    capturedOnAddExpense = null;
    capturedOnDeleteExpense = null;
    capturedOnAddCustomCategory = null;
  });

  describe("localStorage loading", () => {
    it("should load expenses from localStorage on mount", () => {
      seedLocalStorage([sampleExpense]);
      render(<Home />);
      // May appear in both overview and history lists
      expect(screen.getAllByTestId("expense-e1").length).toBeGreaterThan(0);
    });

    it("should load custom categories from localStorage on mount", () => {
      seedLocalStorage([], ["Pets", "Subscriptions"]);
      render(<Home />);
      expect(screen.getByTestId("custom-categories")).toHaveTextContent(
        "Pets,Subscriptions"
      );
    });

    it("should start with empty state when localStorage is empty", () => {
      render(<Home />);
      expect(screen.getByTestId("expense-stats")).toHaveTextContent(
        "0 expenses"
      );
    });

    it("should handle corrupted expense JSON in localStorage without crashing", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{{");
      expect(() => render(<Home />)).not.toThrow();
    });

    it("should handle corrupted categories JSON in localStorage without crashing", () => {
      localStorage.setItem(CATEGORIES_KEY, "{ broken }");
      expect(() => render(<Home />)).not.toThrow();
    });
  });

  describe("adding expenses", () => {
    it("should add an expense to the list when onAddExpense is called", () => {
      render(<Home />);
      act(() => {
        capturedOnAddExpense!(sampleExpense);
      });
      expect(screen.getAllByTestId("expense-e1").length).toBeGreaterThan(0);
    });

    it("should persist the new expense to localStorage", () => {
      render(<Home />);
      act(() => {
        capturedOnAddExpense!(sampleExpense);
      });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("e1");
    });

    it("should prepend new expenses so the newest appears first", () => {
      const older: Expense = { ...sampleExpense, id: "old", description: "Old" };
      seedLocalStorage([older]);
      render(<Home />);

      const newer: Expense = { ...sampleExpense, id: "new", description: "New" };
      act(() => {
        capturedOnAddExpense!(newer);
      });

      const stored: Expense[] = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored[0].id).toBe("new");
      expect(stored[1].id).toBe("old");
    });
  });

  describe("deleting expenses", () => {
    it("should remove the expense from the list when onDeleteExpense is called", () => {
      seedLocalStorage([sampleExpense]);
      render(<Home />);

      act(() => {
        capturedOnDeleteExpense!("e1");
      });

      expect(screen.queryAllByTestId("expense-e1")).toHaveLength(0);
    });

    it("should persist the deletion to localStorage", () => {
      seedLocalStorage([sampleExpense]);
      render(<Home />);

      act(() => {
        capturedOnDeleteExpense!("e1");
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(0);
    });

    it("should not remove other expenses when deleting one", () => {
      const e2: Expense = { ...sampleExpense, id: "e2", description: "Tea" };
      seedLocalStorage([sampleExpense, e2]);
      render(<Home />);

      act(() => {
        capturedOnDeleteExpense!("e1");
      });

      expect(screen.getAllByTestId("expense-e2").length).toBeGreaterThan(0);
    });
  });

  describe("adding custom categories", () => {
    it("should add a new custom category", () => {
      render(<Home />);
      act(() => {
        capturedOnAddCustomCategory!("Pets");
      });
      expect(screen.getByTestId("custom-categories")).toHaveTextContent("Pets");
    });

    it("should not add a duplicate custom category", () => {
      seedLocalStorage([], ["Pets"]);
      render(<Home />);

      act(() => {
        capturedOnAddCustomCategory!("Pets");
      });

      // Should still only appear once in the comma-separated list
      const text = screen.getByTestId("custom-categories").textContent ?? "";
      const count = text.split(",").filter((c) => c === "Pets").length;
      expect(count).toBe(1);
    });

    it("should persist the new category to localStorage", () => {
      render(<Home />);
      act(() => {
        capturedOnAddCustomCategory!("Hobbies");
      });
      const stored = JSON.parse(localStorage.getItem(CATEGORIES_KEY)!);
      expect(stored).toContain("Hobbies");
    });
  });
});
