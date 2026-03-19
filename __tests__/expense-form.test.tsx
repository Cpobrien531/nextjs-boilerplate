import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseForm } from "@/components/expense-form";

// Mock complex sub-components that use Radix UI internals
jest.mock("@/components/receipt-scanner", () => ({
  ReceiptScanner: ({
    onScanComplete,
  }: {
    onScanComplete: (r: {
      amount: number;
      description: string;
      category: string;
      date: string;
    }) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-scanner"
      onClick={() =>
        onScanComplete({
          amount: 42.5,
          description: "Scanned receipt",
          category: "Food & Dining",
          date: "2026-03-01",
        })
      }
    >
      Scan Receipt
    </button>
  ),
}));

jest.mock("@/components/category-select", () => ({
  CategorySelect: ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    customCategories: string[];
    onAddCustomCategory: (c: string) => void;
  }) => (
    <select
      data-testid="category-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">Select a category</option>
      <option value="Food & Dining">Food & Dining</option>
      <option value="Transportation">Transportation</option>
      <option value="Shopping">Shopping</option>
    </select>
  ),
}));

jest.mock("@/components/tag-input", () => ({
  TagInput: ({
    tags,
    onTagsChange,
  }: {
    tags: string[];
    onTagsChange: (t: string[]) => void;
  }) => (
    <input
      data-testid="tag-input"
      value={tags.join(",")}
      onChange={(e) =>
        onTagsChange(e.target.value ? e.target.value.split(",") : [])
      }
    />
  ),
}));

function setup() {
  const onAddExpense = jest.fn();
  const onAddCustomCategory = jest.fn();
  render(
    <ExpenseForm
      onAddExpense={onAddExpense}
      customCategories={[]}
      onAddCustomCategory={onAddCustomCategory}
    />
  );
  return { onAddExpense, onAddCustomCategory };
}

async function fillForm(overrides: {
  amount?: string;
  description?: string;
  category?: string;
} = {}) {
  const { amount = "25.50", description = "Lunch", category = "Food & Dining" } =
    overrides;

  if (amount) await userEvent.type(screen.getByLabelText(/Amount/i), amount);
  if (description)
    await userEvent.type(screen.getByLabelText(/Description/i), description);
  if (category)
    await userEvent.selectOptions(
      screen.getByTestId("category-select"),
      category
    );
}

describe("ExpenseForm", () => {
  describe("validation", () => {
    it("should not call onAddExpense when amount is missing", async () => {
      const { onAddExpense } = setup();
      await userEvent.type(screen.getByLabelText(/Description/i), "Lunch");
      await userEvent.selectOptions(
        screen.getByTestId("category-select"),
        "Food & Dining"
      );
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      expect(onAddExpense).not.toHaveBeenCalled();
    });

    it("should not call onAddExpense when description is missing", async () => {
      const { onAddExpense } = setup();
      await userEvent.type(screen.getByLabelText(/Amount/i), "25");
      await userEvent.selectOptions(
        screen.getByTestId("category-select"),
        "Food & Dining"
      );
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      expect(onAddExpense).not.toHaveBeenCalled();
    });

    it("should not call onAddExpense when category is not selected", async () => {
      const { onAddExpense } = setup();
      await userEvent.type(screen.getByLabelText(/Amount/i), "25");
      await userEvent.type(screen.getByLabelText(/Description/i), "Lunch");
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      expect(onAddExpense).not.toHaveBeenCalled();
    });
  });

  describe("successful submission", () => {
    it("should call onAddExpense with the correct data", async () => {
      const { onAddExpense } = setup();
      await fillForm({ amount: "25.50", description: "Lunch", category: "Food & Dining" });
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      expect(onAddExpense).toHaveBeenCalledTimes(1);
      const [expense] = onAddExpense.mock.calls[0];
      expect(expense.amount).toBe(25.5);
      expect(expense.description).toBe("Lunch");
      expect(expense.category).toBe("Food & Dining");
      expect(expense.id).toBeDefined();
      expect(expense.date).toBeDefined();
    });

    it("should generate a unique id for each expense", async () => {
      const onAddExpense = jest.fn();
      const onAddCustomCategory = jest.fn();

      const { rerender } = render(
        <ExpenseForm
          onAddExpense={onAddExpense}
          customCategories={[]}
          onAddCustomCategory={onAddCustomCategory}
        />
      );

      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      rerender(
        <ExpenseForm
          onAddExpense={onAddExpense}
          customCategories={[]}
          onAddCustomCategory={onAddCustomCategory}
        />
      );

      await fillForm({ amount: "10", description: "Coffee", category: "Food & Dining" });
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      const id1 = onAddExpense.mock.calls[0][0].id;
      const id2 = onAddExpense.mock.calls[1][0].id;
      expect(id1).not.toBe(id2);
    });

    it("should reset the form fields after a successful submission", async () => {
      setup();
      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      expect(screen.getByLabelText(/Amount/i)).toHaveValue(null);
      expect(screen.getByLabelText(/Description/i)).toHaveValue("");
    });

    it("should include tags in the submitted expense", async () => {
      const { onAddExpense } = setup();
      await fillForm();
      // Set tags via the mock tag input
      await userEvent.clear(screen.getByTestId("tag-input"));
      await userEvent.type(screen.getByTestId("tag-input"), "work,personal");
      await userEvent.click(screen.getByRole("button", { name: /Add Expense/i }));

      const [expense] = onAddExpense.mock.calls[0];
      expect(expense.tags).toEqual(["work", "personal"]);
    });
  });

  describe("default values", () => {
    it("should default the date to today", () => {
      setup();
      const today = new Date().toISOString().split("T")[0];
      expect(screen.getByLabelText(/Date/i)).toHaveValue(today);
    });
  });

  describe("receipt scanner", () => {
    it("should populate form fields when a receipt is scanned", async () => {
      setup();
      await userEvent.click(screen.getByTestId("mock-scanner"));

      expect(screen.getByLabelText(/Amount/i)).toHaveValue(42.5);
      expect(screen.getByLabelText(/Description/i)).toHaveValue("Scanned receipt");
      expect(screen.getByLabelText(/Date/i)).toHaveValue("2026-03-01");
    });
  });
});
