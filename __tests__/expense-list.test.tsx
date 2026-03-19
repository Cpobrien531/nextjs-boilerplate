import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseList } from "@/components/expense-list";
import { Expense } from "@/components/expense-form";

// Replace Radix Select with a native <select> so jsdom can interact with it.
// SelectTrigger/SelectValue are presentation-only and must NOT render inside <select>.
jest.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "1",
    amount: 100,
    description: "Test expense",
    category: "Food & Dining",
    date: "2026-03-10",
    tags: [],
    ...overrides,
  };
}

const SAMPLE_EXPENSES: Expense[] = [
  makeExpense({ id: "1", amount: 50, description: "Lunch", category: "Food & Dining", date: "2026-03-15", tags: ["work"] }),
  makeExpense({ id: "2", amount: 200, description: "Uber", category: "Transportation", date: "2026-03-10", tags: [] }),
  makeExpense({ id: "3", amount: 80, description: "Groceries", category: "Food & Dining", date: "2026-03-12", tags: ["personal"] }),
];

function setup(
  expenses: Expense[] = SAMPLE_EXPENSES,
  onDeleteExpense = jest.fn(),
  customCategories: string[] = []
) {
  render(
    <ExpenseList
      expenses={expenses}
      onDeleteExpense={onDeleteExpense}
      customCategories={customCategories}
    />
  );
  return { onDeleteExpense };
}

describe("ExpenseList", () => {
  describe("empty state", () => {
    it("should show empty-state message when no expenses are provided", () => {
      setup([]);
      expect(screen.getByText("No expenses found")).toBeInTheDocument();
    });

    it("should show prompt to add first expense when list is empty", () => {
      setup([]);
      expect(
        screen.getByText("Add your first expense to get started")
      ).toBeInTheDocument();
    });
  });

  describe("rendering expenses", () => {
    it("should render all expense descriptions", () => {
      setup();
      expect(screen.getByText("Lunch")).toBeInTheDocument();
      expect(screen.getByText("Uber")).toBeInTheDocument();
      expect(screen.getByText("Groceries")).toBeInTheDocument();
    });

    it("should display formatted amounts for each expense", () => {
      setup();
      expect(screen.getByText("$50.00")).toBeInTheDocument();
      expect(screen.getByText("$200.00")).toBeInTheDocument();
      expect(screen.getByText("$80.00")).toBeInTheDocument();
    });

    it("should display the category badge for each expense", () => {
      setup();
      // Categories appear in both expense badges and the filter dropdown options
      expect(screen.getAllByText("Food & Dining").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Transportation").length).toBeGreaterThan(0);
    });

    it("should render tags on expenses that have them", () => {
      setup();
      // Tags appear in both the badge and the tag-filter dropdown
      expect(screen.getAllByText("work").length).toBeGreaterThan(0);
      expect(screen.getAllByText("personal").length).toBeGreaterThan(0);
    });
  });

  describe("delete", () => {
    it("should call onDeleteExpense with the correct id when delete is clicked", async () => {
      const onDeleteExpense = jest.fn();
      setup(
        [makeExpense({ id: "abc-123", description: "Solo expense" })],
        onDeleteExpense
      );

      await userEvent.click(screen.getByRole("button"));
      expect(onDeleteExpense).toHaveBeenCalledWith("abc-123");
    });

    it("should call onDeleteExpense exactly once per click", async () => {
      const onDeleteExpense = jest.fn();
      setup([makeExpense({ id: "x1" })], onDeleteExpense);

      await userEvent.click(screen.getByRole("button"));
      expect(onDeleteExpense).toHaveBeenCalledTimes(1);
    });
  });

  describe("filtering by category", () => {
    it("should show all expenses when 'All' is selected", () => {
      setup();
      expect(screen.getByText("Lunch")).toBeInTheDocument();
      expect(screen.getByText("Uber")).toBeInTheDocument();
    });

    it("should show only matching expenses when a category is selected", async () => {
      setup();
      const selects = screen.getAllByRole("combobox");
      await userEvent.selectOptions(selects[0], "Transportation");

      expect(screen.queryByText("Lunch")).not.toBeInTheDocument();
      expect(screen.getByText("Uber")).toBeInTheDocument();
    });

    it("should show empty state when filter matches no expenses", async () => {
      setup();
      const selects = screen.getAllByRole("combobox");
      await userEvent.selectOptions(selects[0], "Healthcare");

      expect(screen.getByText("No expenses found")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("should sort by date descending by default (newest first)", () => {
      setup();
      // CardTitle also renders as h4 (data-slot="card-title"); exclude it
      const descriptions = screen
        .getAllByRole("heading", { level: 4 })
        .filter((el) => el.getAttribute("data-slot") !== "card-title")
        .map((el) => el.textContent);

      // Mar 15 > Mar 12 > Mar 10
      expect(descriptions).toEqual(["Lunch", "Groceries", "Uber"]);
    });

    it("should sort by amount descending when 'Sort by Amount' is selected", async () => {
      setup();
      const selects = screen.getAllByRole("combobox");
      const sortSelect = selects[selects.length - 1];
      await userEvent.selectOptions(sortSelect, "amount");

      const descriptions = screen
        .getAllByRole("heading", { level: 4 })
        .filter((el) => el.getAttribute("data-slot") !== "card-title")
        .map((el) => el.textContent);

      // $200 > $80 > $50
      expect(descriptions).toEqual(["Uber", "Groceries", "Lunch"]);
    });
  });

  describe("custom categories", () => {
    it("should include custom categories in the filter dropdown", () => {
      setup(SAMPLE_EXPENSES, jest.fn(), ["Pets", "Subscriptions"]);
      const options = screen.getAllByRole("option").map((o) => o.textContent);
      expect(options).toContain("Pets");
      expect(options).toContain("Subscriptions");
    });
  });
});
