import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickAddExpenseDialog } from "@/components/quick-add-expense-dialog";
import { Expense } from "@/components/expense-form";

// ── Radix Dialog → transparent wrapper ──────────────────────────────────────
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// ── fetch mock ───────────────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeCategorizationResponse(category: string) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        data: { suggestedCategory: category, confidence: 0.95 },
      }),
  } as Response);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
interface SetupOptions {
  open?: boolean;
  onAddExpense?: jest.Mock;
  onOpenChange?: jest.Mock;
}

function setup({
  open = true,
  onAddExpense = jest.fn(),
  onOpenChange = jest.fn(),
}: SetupOptions = {}) {
  render(
    <QuickAddExpenseDialog
      open={open}
      onOpenChange={onOpenChange}
      onAddExpense={onAddExpense}
      customCategories={[]}
      onAddCustomCategory={jest.fn()}
    />
  );
  return { onAddExpense, onOpenChange };
}

async function fillAndSubmit(description: string, amount: string) {
  await userEvent.type(screen.getByLabelText(/description/i), description);
  await userEvent.type(screen.getByLabelText(/amount/i), amount);
  await userEvent.click(screen.getByRole("button", { name: /add expense/i }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("QuickAddExpenseDialog", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Visibility ────────────────────────────────────────────────────────────

  describe("visibility", () => {
    it("renders the dialog when open=true", () => {
      setup({ open: true });
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    it("does not render the dialog when open=false", () => {
      setup({ open: false });
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("calls onOpenChange(false) when Cancel is clicked", async () => {
      const onOpenChange = jest.fn();
      setup({ onOpenChange });
      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ── Submit button state ───────────────────────────────────────────────────

  describe("submit button disabled state", () => {
    it("is disabled when both fields are empty", () => {
      setup();
      expect(
        screen.getByRole("button", { name: /add expense/i })
      ).toBeDisabled();
    });

    it("is disabled when only description is filled in", async () => {
      setup();
      await userEvent.type(screen.getByLabelText(/description/i), "Coffee");
      expect(
        screen.getByRole("button", { name: /add expense/i })
      ).toBeDisabled();
    });

    it("is disabled when only amount is filled in", async () => {
      setup();
      await userEvent.type(screen.getByLabelText(/amount/i), "5");
      expect(
        screen.getByRole("button", { name: /add expense/i })
      ).toBeDisabled();
    });

    it("is enabled when both description and amount are filled in", async () => {
      setup();
      await userEvent.type(screen.getByLabelText(/description/i), "Coffee");
      await userEvent.type(screen.getByLabelText(/amount/i), "5");
      expect(
        screen.getByRole("button", { name: /add expense/i })
      ).toBeEnabled();
    });
  });

  // ── AI categorization ─────────────────────────────────────────────────────

  describe("AI categorization", () => {
    it("uses the AI-suggested category when the API responds successfully", async () => {
      mockFetch.mockReturnValueOnce(
        makeCategorizationResponse("Transportation")
      );
      const onAddExpense = jest.fn();
      setup({ onAddExpense });

      await fillAndSubmit("Uber ride", "12.50");

      await waitFor(() => expect(onAddExpense).toHaveBeenCalledTimes(1));
      const expense: Expense = onAddExpense.mock.calls[0][0];
      expect(expense.category).toBe("Transportation");
    });

    it("falls back to 'Other' when the API call fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const onAddExpense = jest.fn();
      setup({ onAddExpense });

      await fillAndSubmit("Mystery item", "5.00");

      await waitFor(() => expect(onAddExpense).toHaveBeenCalledTimes(1));
      const expense: Expense = onAddExpense.mock.calls[0][0];
      expect(expense.category).toBe("Other");
    });

    it("falls back to 'Other' when success=false in the API response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      } as Response);
      const onAddExpense = jest.fn();
      setup({ onAddExpense });

      await fillAndSubmit("Unknown item", "3.00");

      await waitFor(() => expect(onAddExpense).toHaveBeenCalledTimes(1));
      expect(onAddExpense.mock.calls[0][0].category).toBe("Other");
    });

    it("sends the description to the AI endpoint as expenseName", async () => {
      mockFetch.mockReturnValueOnce(makeCategorizationResponse("Food & Dining"));
      setup();

      await fillAndSubmit("Sushi dinner", "45.00");

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.expenseName).toBe("Sushi dinner");
    });

    it("shows a loading label on the button while the API is in flight", async () => {
      // Never resolves so we can read mid-flight state
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      setup();

      await userEvent.type(screen.getByLabelText(/description/i), "Coffee");
      await userEvent.type(screen.getByLabelText(/amount/i), "5");
      await userEvent.click(
        screen.getByRole("button", { name: /add expense/i })
      );

      expect(
        screen.getByRole("button", { name: /categorizing/i })
      ).toBeInTheDocument();
    });
  });

  // ── Expense shape ─────────────────────────────────────────────────────────

  describe("submitted expense shape", () => {
    beforeEach(() => {
      mockFetch.mockReturnValue(makeCategorizationResponse("Shopping"));
    });

    it("parses amount as a float", async () => {
      const onAddExpense = jest.fn();
      setup({ onAddExpense });

      await fillAndSubmit("Book", "19.99");

      await waitFor(() => expect(onAddExpense).toHaveBeenCalledTimes(1));
      expect(onAddExpense.mock.calls[0][0].amount).toBe(19.99);
    });

    it("sets date to today's date", async () => {
      const onAddExpense = jest.fn();
      setup({ onAddExpense });
      const today = new Date().toISOString().split("T")[0];

      await fillAndSubmit("Stationery", "7.50");

      await waitFor(() => expect(onAddExpense).toHaveBeenCalledTimes(1));
      expect(onAddExpense.mock.calls[0][0].date).toBe(today);
    });

    it("always sets tags to an empty array", async () => {
      const onAddExpense = jest.fn();
      setup({ onAddExpense });

      await fillAndSubmit("Pen", "2.00");

      await waitFor(() => expect(onAddExpense).toHaveBeenCalledTimes(1));
      expect(onAddExpense.mock.calls[0][0].tags).toEqual([]);
    });

    it("includes an id on the expense", async () => {
      const onAddExpense = jest.fn();
      setup({ onAddExpense });

      await fillAndSubmit("Notebook", "8.00");

      await waitFor(() => expect(onAddExpense).toHaveBeenCalledTimes(1));
      expect(onAddExpense.mock.calls[0][0].id).toBeDefined();
    });
  });

  // ── Post-submit behaviour ─────────────────────────────────────────────────

  describe("post-submit behaviour", () => {
    it("clears the form fields after a successful submission", async () => {
      mockFetch.mockReturnValueOnce(makeCategorizationResponse("Food & Dining"));
      setup();

      await fillAndSubmit("Coffee", "5");

      await waitFor(() =>
        expect(screen.getByLabelText(/description/i)).toHaveValue("")
      );
      expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
    });

    it("calls onOpenChange(false) after a successful submission", async () => {
      mockFetch.mockReturnValueOnce(makeCategorizationResponse("Food & Dining"));
      const onOpenChange = jest.fn();
      setup({ onOpenChange });

      await fillAndSubmit("Coffee", "5");

      await waitFor(() =>
        expect(onOpenChange).toHaveBeenCalledWith(false)
      );
    });
  });
});
