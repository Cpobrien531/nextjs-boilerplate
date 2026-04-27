import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategorySelect } from "@/components/category-select";

// ── Radix Select → native <select> ──────────────────────────────────────────
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
    <select
      data-testid="category-dropdown"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

// ── Radix Dialog → simple div wrapper ───────────────────────────────────────
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

// ── sonner toast (side-effect only, not under test here) ───────────────────
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ── fetch mock ───────────────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeSuccessResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  } as Response);
}

function makeErrorResponse(error: string, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, error }),
  } as Response);
}

// ── Helper ───────────────────────────────────────────────────────────────────
function setup({
  value = "",
  customCategories = ["Food & Dining", "Transportation"],
  onValueChange = jest.fn(),
  onAddCustomCategory = jest.fn(),
  onDeleteCustomCategory = jest.fn(),
  onCategoriesChange = jest.fn(),
} = {}) {
  render(
    <CategorySelect
      value={value}
      onValueChange={onValueChange}
      customCategories={customCategories}
      onAddCustomCategory={onAddCustomCategory}
      onDeleteCustomCategory={onDeleteCustomCategory}
      onCategoriesChange={onCategoriesChange}
    />
  );
  return { onValueChange, onAddCustomCategory, onDeleteCustomCategory, onCategoriesChange };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CategorySelect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Dropdown rendering ────────────────────────────────────────────────────

  describe("dropdown rendering", () => {
    it("renders all custom categories as options", () => {
      setup();
      const options = screen
        .getAllByRole("option")
        .map((o) => o.textContent);
      expect(options).toContain("Food & Dining");
      expect(options).toContain("Transportation");
    });

    it("renders an empty dropdown when no categories are provided", () => {
      setup({ customCategories: [] });
      const dropdown = screen.getByTestId("category-dropdown");
      expect(dropdown.children).toHaveLength(0);
    });

    it("reflects the current value in the dropdown", () => {
      setup({ value: "Transportation" });
      expect(screen.getByTestId("category-dropdown")).toHaveValue(
        "Transportation"
      );
    });

    it("calls onValueChange when a different option is selected", async () => {
      const onValueChange = jest.fn();
      setup({ onValueChange });
      await userEvent.selectOptions(
        screen.getByTestId("category-dropdown"),
        "Transportation"
      );
      expect(onValueChange).toHaveBeenCalledWith("Transportation");
    });
  });

  // ── Dialog open / close ───────────────────────────────────────────────────

  describe("manage-categories dialog", () => {
    it("dialog is not visible initially", () => {
      setup();
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("opens the dialog when the + button is clicked", async () => {
      setup();
      await userEvent.click(
        screen.getByRole("button", { name: /add custom category/i })
      );
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    it("closes the dialog when Cancel is clicked", async () => {
      setup();
      await userEvent.click(
        screen.getByRole("button", { name: /add custom category/i })
      );
      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("shows a count of existing categories in the dialog", async () => {
      setup({ customCategories: ["Food & Dining", "Transportation"] });
      await userEvent.click(
        screen.getByRole("button", { name: /add custom category/i })
      );
      expect(screen.getByText(/All Categories \(2\)/i)).toBeInTheDocument();
    });
  });

  // ── Adding a category ────────────────────────────────────────────────────

  describe("adding a category", () => {
    async function openDialog() {
      await userEvent.click(
        screen.getByRole("button", { name: /add custom category/i })
      );
    }

    it("calls onAddCustomCategory and onValueChange when a new name is submitted", async () => {
      const onAddCustomCategory = jest.fn();
      const onValueChange = jest.fn();
      setup({ onAddCustomCategory, onValueChange });

      await openDialog();
      await userEvent.type(
        screen.getByLabelText(/add category name/i),
        "Hobbies"
      );
      await userEvent.click(
        screen.getByRole("button", { name: /add category/i })
      );

      expect(onAddCustomCategory).toHaveBeenCalledWith("Hobbies");
      expect(onValueChange).toHaveBeenCalledWith("Hobbies");
    });

    it("submits via Enter key as well as the button", async () => {
      const onAddCustomCategory = jest.fn();
      setup({ onAddCustomCategory, customCategories: [] });

      await openDialog();
      await userEvent.type(
        screen.getByLabelText(/add category name/i),
        "Pets{enter}"
      );

      expect(onAddCustomCategory).toHaveBeenCalledWith("Pets");
    });

    it("trims whitespace from the category name", async () => {
      const onAddCustomCategory = jest.fn();
      setup({ onAddCustomCategory, customCategories: [] });

      await openDialog();
      await userEvent.type(
        screen.getByLabelText(/add category name/i),
        "  Wellness  {enter}"
      );

      expect(onAddCustomCategory).toHaveBeenCalledWith("Wellness");
    });

    it("does not add a duplicate category", async () => {
      const onAddCustomCategory = jest.fn();
      setup({ onAddCustomCategory, customCategories: ["Food & Dining"] });

      await openDialog();
      await userEvent.type(
        screen.getByLabelText(/add category name/i),
        "Food & Dining{enter}"
      );

      expect(onAddCustomCategory).not.toHaveBeenCalled();
    });

    it("Add Category button is disabled when the input is empty", async () => {
      setup();
      await openDialog();
      expect(
        screen.getByRole("button", { name: /add category/i })
      ).toBeDisabled();
    });

    it("closes the dialog after a successful add", async () => {
      setup({ customCategories: [] });
      await openDialog();
      await userEvent.type(
        screen.getByLabelText(/add category name/i),
        "Hobbies{enter}"
      );
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });
  });

  // ── Deleting a category ───────────────────────────────────────────────────

  describe("deleting a category", () => {
    async function openDialog() {
      await userEvent.click(
        screen.getByRole("button", { name: /add custom category/i })
      );
    }

    it("calls the DELETE API with the correct category name", async () => {
      mockFetch.mockReturnValueOnce(makeSuccessResponse({}));
      setup({ customCategories: ["Food & Dining"] });

      await openDialog();
      // The X button inside the category chip
      await userEvent.click(screen.getByTitle("Delete category"));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("Food%20%26%20Dining"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("calls onCategoriesChange after a successful delete", async () => {
      mockFetch.mockReturnValueOnce(makeSuccessResponse({}));
      const onCategoriesChange = jest.fn();
      setup({ customCategories: ["Food & Dining"], onCategoriesChange });

      await openDialog();
      await userEvent.click(screen.getByTitle("Delete category"));

      await waitFor(() =>
        expect(onCategoriesChange).toHaveBeenCalledTimes(1)
      );
    });

    it("shows a toast error when the API returns a failure", async () => {
      const { toast } = require("sonner");
      mockFetch.mockReturnValueOnce(
        makeErrorResponse("Cannot delete category that has associated expenses")
      );
      setup({ customCategories: ["Food & Dining"] });

      await openDialog();
      await userEvent.click(screen.getByTitle("Delete category"));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Cannot delete category that has associated expenses"
        )
      );
    });

    it("shows a toast error when the network request throws", async () => {
      const { toast } = require("sonner");
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));
      setup({ customCategories: ["Food & Dining"] });

      await openDialog();
      await userEvent.click(screen.getByTitle("Delete category"));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Network failure")
      );
    });

    it("disables the delete button while a deletion is in progress", async () => {
      // Never resolves so we can check mid-flight state
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      setup({ customCategories: ["Food & Dining"] });

      await openDialog();
      const deleteBtn = screen.getByTitle("Delete category");
      await userEvent.click(deleteBtn);

      expect(deleteBtn).toBeDisabled();
    });
  });
});
