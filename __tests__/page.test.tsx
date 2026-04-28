import { render, screen, act, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import { Expense } from "@/components/expense-form";

// Mock fetch
global.fetch = jest.fn();

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
    jest.clearAllMocks();
    capturedOnAddExpense = null;
    capturedOnDeleteExpense = null;
    capturedOnAddCustomCategory = null;

    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url === "/api/expenses" && (!options || options.method === "GET")) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      }
      if (url === "/api/categories" && (!options || options.method === "GET")) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      }
      if (url === "/api/expenses" && options?.method === "POST") {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url === "/api/categories" && options?.method === "POST") {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url.startsWith("/api/expenses/") && options?.method === "DELETE") {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: false, error: "Not mocked" }),
      });
    });
  });

  describe("API loading", () => {
    it("should fetch expenses on mount when authenticated", async () => {
      render(<Home />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/expenses");
      });
    });

    it("should fetch categories on mount when authenticated", async () => {
      render(<Home />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/categories");
      });
    });

    it("should display fetched expenses", async () => {
      // Mock the expenses fetch
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/expenses") {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: [sampleExpense] }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });
      render(<Home />);
      await waitFor(() => {
        expect(screen.getAllByTestId("expense-e1").length).toBeGreaterThan(0);
      });
    });

    it("should display fetched categories", async () => {
      // Mock the categories fetch
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/categories") {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: ["Pets", "Subscriptions"] }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId("custom-categories")).toHaveTextContent(
          "Pets,Subscriptions"
        );
      });
    });
  });

  describe("adding expenses", () => {
    it("should call API to add expense when onAddExpense is called", async () => {
      render(<Home />);
      act(() => {
        capturedOnAddExpense!(sampleExpense);
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleExpense),
      });
    });

    it("should refetch expenses after adding", async () => {
      render(<Home />);
      act(() => {
        capturedOnAddExpense!(sampleExpense);
      });
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/expenses");
      });
    });
  });

  describe("deleting expenses", () => {
    it("should call API to delete expense when onDeleteExpense is called", async () => {
      render(<Home />);
      act(() => {
        capturedOnDeleteExpense!("e1");
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/expenses/e1", {
        method: "DELETE",
      });
    });

    it("should refetch expenses after deleting", async () => {
      render(<Home />);
      act(() => {
        capturedOnDeleteExpense!("e1");
      });
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/expenses");
      });
    });
  });

  describe("adding custom categories", () => {
    it("should call API to add custom category when onAddCustomCategory is called", async () => {
      render(<Home />);
      act(() => {
        capturedOnAddCustomCategory!("Pets");
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Pets" }),
      });
    });

    it("should update local state when category is added successfully", async () => {
      render(<Home />);
      act(() => {
        capturedOnAddCustomCategory!("Pets");
      });
      await waitFor(() => {
        expect(screen.getByTestId("custom-categories")).toHaveTextContent("Pets");
      });
    });
  });
});
