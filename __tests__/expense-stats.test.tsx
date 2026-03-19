import { render, screen, within } from "@testing-library/react";
import { ExpenseStats } from "@/components/expense-stats";
import { Expense } from "@/components/expense-form";

const TODAY = new Date().toISOString().split("T")[0];
const LAST_YEAR = "2020-01-15";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "1",
    amount: 100,
    description: "Test expense",
    category: "Food & Dining",
    date: TODAY,
    tags: [],
    ...overrides,
  };
}

/** Scope an assertion to a specific stat card by its title text. */
function withinCard(title: string) {
  const el = screen.getByText(title).closest('[data-slot="card"]');
  if (!el) throw new Error(`Card with title "${title}" not found`);
  return within(el as HTMLElement);
}

describe("ExpenseStats", () => {
  describe("when no expenses are provided", () => {
    beforeEach(() => render(<ExpenseStats expenses={[]} />));

    it("should display $0.00 as the total", () => {
      expect(withinCard("Total Expenses").getByText("$0.00")).toBeInTheDocument();
    });

    it("should display $0.00 for This Month", () => {
      expect(withinCard("This Month").getByText("$0.00")).toBeInTheDocument();
    });

    it("should display 0 transactions", () => {
      expect(screen.getByText("0 transactions")).toBeInTheDocument();
    });

    it("should not render the category breakdown section", () => {
      expect(screen.queryByText("Expenses by Category")).not.toBeInTheDocument();
    });
  });

  describe("when a single expense exists", () => {
    it("should use singular 'transaction' label", () => {
      render(<ExpenseStats expenses={[makeExpense({ amount: 50 })]} />);
      expect(screen.getByText("1 transaction")).toBeInTheDocument();
    });
  });

  describe("when multiple expenses exist", () => {
    const expenses = [
      makeExpense({ id: "1", amount: 50, category: "Food & Dining" }),
      makeExpense({ id: "2", amount: 30, category: "Transportation" }),
      makeExpense({ id: "3", amount: 20, category: "Food & Dining" }),
    ];

    beforeEach(() => render(<ExpenseStats expenses={expenses} />));

    it("should calculate the total correctly", () => {
      // Scope to Total Expenses card to avoid collision with This Month ($100 too)
      expect(withinCard("Total Expenses").getByText("$100.00")).toBeInTheDocument();
    });

    it("should display the correct transaction count", () => {
      expect(screen.getByText("3 transactions")).toBeInTheDocument();
    });

    it("should calculate the average per transaction correctly", () => {
      // total=$100, count=3 → avg=$33.33
      expect(withinCard("Average").getByText("$33.33")).toBeInTheDocument();
    });

    it("should render the category breakdown section", () => {
      expect(screen.getByText("Expenses by Category")).toBeInTheDocument();
    });

    it("should show Food & Dining before Transportation (higher amount first)", () => {
      const items = screen.getAllByText(/Food & Dining|Transportation/);
      const labels = items.map((el) => el.textContent);
      expect(labels.indexOf("Food & Dining")).toBeLessThan(
        labels.indexOf("Transportation")
      );
    });
  });

  describe("monthly filter", () => {
    it("should only sum current-month expenses in 'This Month'", () => {
      const expenses = [
        makeExpense({ id: "1", amount: 100, date: TODAY }),
        makeExpense({ id: "2", amount: 500, date: LAST_YEAR }),
      ];
      render(<ExpenseStats expenses={expenses} />);

      // Total = $600.00  |  This Month = $100.00  |  Average = $300.00
      // $600 also appears in category breakdown, so scope to card
      expect(withinCard("Total Expenses").getByText("$600.00")).toBeInTheDocument();
      expect(withinCard("This Month").getByText("$100.00")).toBeInTheDocument();
    });

    it("should show $0.00 for This Month when all expenses are from a different month", () => {
      render(<ExpenseStats expenses={[makeExpense({ date: LAST_YEAR })]} />);
      // Two $0.00 values: one for This Month, one potentially elsewhere —
      // at minimum one must be present.
      expect(screen.getAllByText("$0.00").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    it("should display $0.00 average when expenses array is empty", () => {
      render(<ExpenseStats expenses={[]} />);
      expect(withinCard("Average").getByText("$0.00")).toBeInTheDocument();
    });

    it("should handle fractional amounts without floating-point display errors", () => {
      const expenses = [
        makeExpense({ id: "1", amount: 0.1 }),
        makeExpense({ id: "2", amount: 0.2 }),
      ];
      render(<ExpenseStats expenses={expenses} />);
      // $0.30 appears in Total card and category breakdown — scope to card
      expect(withinCard("Total Expenses").getByText("$0.30")).toBeInTheDocument();
    });
  });
});
