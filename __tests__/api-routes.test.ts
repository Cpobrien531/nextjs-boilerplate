/**
 * API Route Tests
 * mock both `next-auth` (session) and `@/lib/db` (prisma) so that
 * every test is fast, deterministic, and requires no database.
 * The route handlers are imported directly and called with a synthetic Request
 * object, matching the Next.js App Router handler signature.
 */

// ── next-auth session mock ────────────────────────────────────────────────────
const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({ getServerSession: (...args: unknown[]) => mockGetServerSession(...args) }));

// ── prisma mock ───────────────────────────────────────────────────────────────
const mockPrisma = {
  expense: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  budget: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  tag: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  expenseTag: {
    create: jest.fn(),
  },
};
jest.mock("@/lib/db", () => ({ prisma: mockPrisma }));
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

// ── AI helper mock ────────────────────────────────────────────────────────────
const mockCategorizeExpense = jest.fn();
jest.mock("@/lib/ai", () => ({
  categorizeExpense: (...args: unknown[]) => mockCategorizeExpense(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function authenticatedSession(userId = "1") {
  return { user: { id: userId, name: "Test User", email: "test@test.com" } };
}

function makeRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function parseResponse(res: Response) {
  const data = await res.json();
  return { status: res.status, data };
}

// ─────────────────────────────────────────────────────────────────────────────
// /api/expenses  (GET + POST)
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/expenses", () => {
  // Lazy-import so mocks are in place before module evaluation
  let GET: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ GET } = await import("@/app/api/expenses/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when no session exists", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const { status, data } = await parseResponse(
      await GET(makeRequest("GET", "http://localhost/api/expenses"))
    );
    expect(status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns a formatted list of expenses on success", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.expense.findMany.mockResolvedValueOnce([
      {
        expenseId: 1,
        amount: 42.5,
        vendorName: "Coffee shop",
        expenseDate: new Date("2026-03-15"),
        category: { categoryName: "Food & Dining" },
        tags: [{ tag: { tagName: "work" } }],
      },
    ]);

    const { status, data } = await parseResponse(
      await GET(makeRequest("GET", "http://localhost/api/expenses"))
    );

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0]).toMatchObject({
      id: "1",
      amount: 42.5,
      description: "Coffee shop",
      category: "Food & Dining",
      date: "2026-03-15",
      tags: ["work"],
    });
  });

  it("returns 500 when the database throws", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.expense.findMany.mockRejectedValueOnce(new Error("DB down"));

    const { status, data } = await parseResponse(
      await GET(makeRequest("GET", "http://localhost/api/expenses"))
    );

    expect(status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe("POST /api/expenses", () => {
  let POST: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ POST } = await import("@/app/api/expenses/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    amount: 12.5,
    description: "Lunch",
    category: "Food & Dining",
    date: "2026-03-15",
    tags: [],
  };

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const { status } = await parseResponse(
      await POST(makeRequest("POST", "http://localhost/api/expenses", validBody))
    );
    expect(status).toBe(401);
  });

  it("creates and returns the new expense id on success", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.user.findUnique.mockResolvedValueOnce({ userId: 1 });
    mockPrisma.category.upsert.mockResolvedValueOnce({ categoryId: 5 });
    mockPrisma.expense.create.mockResolvedValueOnce({ expenseId: 99 });

    const { status, data } = await parseResponse(
      await POST(makeRequest("POST", "http://localhost/api/expenses", validBody))
    );

    expect(status).toBe(201);
    expect(data.data.id).toBe("99");
  });

  it("upserts category correctly when creating expense", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.user.findUnique.mockResolvedValueOnce({ userId: 1 });
    mockPrisma.category.upsert.mockResolvedValueOnce({ categoryId: 7 });
    mockPrisma.expense.create.mockResolvedValueOnce({ expenseId: 10 });

    await POST(makeRequest("POST", "http://localhost/api/expenses", validBody));

    expect(mockPrisma.category.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryName: "Food & Dining" },
      })
    );
  });

  it("creates tags and expense-tag links when tags are provided", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.user.findUnique.mockResolvedValueOnce({ userId: 1 });
    mockPrisma.category.upsert.mockResolvedValueOnce({ categoryId: 5 });
    mockPrisma.expense.create.mockResolvedValueOnce({ expenseId: 20 });
    mockPrisma.tag.findFirst.mockResolvedValueOnce(null); // tag doesn't exist yet
    mockPrisma.tag.create.mockResolvedValueOnce({ tagId: 3 });
    mockPrisma.expenseTag.create.mockResolvedValueOnce({});

    const bodyWithTag = { ...validBody, tags: ["work"] };
    await POST(makeRequest("POST", "http://localhost/api/expenses", bodyWithTag));

    expect(mockPrisma.tag.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tagName: "work", tagType: "custom" }),
      })
    );
    expect(mockPrisma.expenseTag.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { expenseId: 20, tagId: 3 } })
    );
  });

  it("reuses an existing tag instead of creating a duplicate", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.user.findUnique.mockResolvedValueOnce({ userId: 1 });
    mockPrisma.category.upsert.mockResolvedValueOnce({ categoryId: 5 });
    mockPrisma.expense.create.mockResolvedValueOnce({ expenseId: 21 });
    mockPrisma.tag.findFirst.mockResolvedValueOnce({ tagId: 8 }); // already exists
    mockPrisma.expenseTag.create.mockResolvedValueOnce({});

    const bodyWithTag = { ...validBody, tags: ["personal"] };
    await POST(makeRequest("POST", "http://localhost/api/expenses", bodyWithTag));

    expect(mockPrisma.tag.create).not.toHaveBeenCalled();
    expect(mockPrisma.expenseTag.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { expenseId: 21, tagId: 8 } })
    );
  });

  it("returns 404 when the user record doesn't exist in the database", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession("999"));
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const { status, data } = await parseResponse(
      await POST(makeRequest("POST", "http://localhost/api/expenses", validBody))
    );

    expect(status).toBe(404);
    expect(data.error).toMatch(/user not found/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/categories  (GET + POST + DELETE)
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/categories", () => {
  let GET: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ GET } = await import("@/app/api/categories/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns an array of category name strings by default", async () => {
    mockPrisma.category.findMany.mockResolvedValueOnce([
      { categoryId: 1, categoryName: "Food & Dining" },
      { categoryId: 2, categoryName: "Transportation" },
    ]);

    const { status, data } = await parseResponse(
      await GET(makeRequest("GET", "http://localhost/api/categories"))
    );

    expect(status).toBe(200);
    expect(data.data).toEqual(["Food & Dining", "Transportation"]);
  });

  it("returns full category objects when ?full=true", async () => {
    const fullCategory = {
      categoryId: 1,
      categoryName: "Food & Dining",
      categoryDescription: null,
    };
    mockPrisma.category.findMany.mockResolvedValueOnce([fullCategory]);

    const { status, data } = await parseResponse(
      await GET(
        makeRequest("GET", "http://localhost/api/categories?full=true")
      )
    );

    expect(status).toBe(200);
    expect(data.data[0]).toMatchObject(fullCategory);
  });
});

describe("POST /api/categories", () => {
  let POST: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ POST } = await import("@/app/api/categories/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when name is missing", async () => {
    const { status, data } = await parseResponse(
      await POST(makeRequest("POST", "http://localhost/api/categories", {}))
    );
    expect(status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("returns 400 when name is whitespace only", async () => {
    const { status } = await parseResponse(
      await POST(
        makeRequest("POST", "http://localhost/api/categories", { name: "   " })
      )
    );
    expect(status).toBe(400);
  });

  it("creates or finds the category and returns 201", async () => {
    mockPrisma.category.upsert.mockResolvedValueOnce({
      categoryId: 3,
      categoryName: "Hobbies",
      categoryDescription: null,
    });

    const { status, data } = await parseResponse(
      await POST(
        makeRequest("POST", "http://localhost/api/categories", {
          name: "Hobbies",
        })
      )
    );

    expect(status).toBe(201);
    expect(data.data.categoryName).toBe("Hobbies");
  });

  it("trims whitespace from the name before upserting", async () => {
    mockPrisma.category.upsert.mockResolvedValueOnce({
      categoryId: 4,
      categoryName: "Pets",
    });

    await POST(
      makeRequest("POST", "http://localhost/api/categories", {
        name: "  Pets  ",
      })
    );

    expect(mockPrisma.category.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryName: "Pets" } })
    );
  });
});

describe("DELETE /api/categories", () => {
  let DELETE: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ DELETE } = await import("@/app/api/categories/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when no name query param is provided", async () => {
    const { status } = await parseResponse(
      await DELETE(makeRequest("DELETE", "http://localhost/api/categories"))
    );
    expect(status).toBe(400);
  });

  it("returns 404 when the category does not exist", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce(null);

    const { status } = await parseResponse(
      await DELETE(
        makeRequest(
          "DELETE",
          "http://localhost/api/categories?name=Nonexistent"
        )
      )
    );
    expect(status).toBe(404);
  });

  it("returns 400 when the category has associated expenses", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({ categoryId: 1 });
    mockPrisma.expense.count.mockResolvedValueOnce(3);

    const { status, data } = await parseResponse(
      await DELETE(
        makeRequest(
          "DELETE",
          "http://localhost/api/categories?name=Food%20%26%20Dining"
        )
      )
    );
    expect(status).toBe(400);
    expect(data.error).toMatch(/associated expenses/i);
  });

  it("returns 400 when the category has assigned budgets", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({ categoryId: 1 });
    mockPrisma.expense.count.mockResolvedValueOnce(0);
    mockPrisma.budget.count.mockResolvedValueOnce(2);

    const { status, data } = await parseResponse(
      await DELETE(
        makeRequest(
          "DELETE",
          "http://localhost/api/categories?name=Travel"
        )
      )
    );
    expect(status).toBe(400);
    expect(data.error).toMatch(/assigned budgets/i);
  });

  it("deletes the category and returns a success message when safe to remove", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({ categoryId: 5 });
    mockPrisma.expense.count.mockResolvedValueOnce(0);
    mockPrisma.budget.count.mockResolvedValueOnce(0);
    mockPrisma.category.delete.mockResolvedValueOnce({});

    const { status, data } = await parseResponse(
      await DELETE(
        makeRequest("DELETE", "http://localhost/api/categories?name=Empty")
      )
    );
    expect(status).toBe(200);
    expect(data.data.message).toMatch(/deleted/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/budgets  (GET + POST)
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/budgets", () => {
  let GET: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ GET } = await import("@/app/api/budgets/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const { status } = await parseResponse(
      await GET(makeRequest("GET", "http://localhost/api/budgets"))
    );
    expect(status).toBe(401);
  });

  it("returns budgets with amountSpent merged from expense groupBy", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.budget.findMany.mockResolvedValueOnce([
      {
        budgetId: 1,
        categoryId: 10,
        category: { categoryName: "Food & Dining" },
        month: 3,
        year: 2026,
        budgetAmount: 500,
      },
    ]);
    mockPrisma.expense.groupBy.mockResolvedValueOnce([
      { categoryId: 10, _sum: { amount: 200 } },
    ]);

    const { status, data } = await parseResponse(
      await GET(
        makeRequest("GET", "http://localhost/api/budgets?month=3&year=2026")
      )
    );

    expect(status).toBe(200);
    expect(data.data[0]).toMatchObject({
      categoryName: "Food & Dining",
      budgetAmount: 500,
      amountSpent: 200,
    });
  });

  it("defaults amountSpent to 0 when there is no matching spending row", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.budget.findMany.mockResolvedValueOnce([
      {
        budgetId: 2,
        categoryId: 20,
        category: { categoryName: "Travel" },
        month: 3,
        year: 2026,
        budgetAmount: 1000,
      },
    ]);
    mockPrisma.expense.groupBy.mockResolvedValueOnce([]); // no spending

    const { data } = await parseResponse(
      await GET(
        makeRequest("GET", "http://localhost/api/budgets?month=3&year=2026")
      )
    );
    expect(data.data[0].amountSpent).toBe(0);
  });
});

describe("POST /api/budgets", () => {
  let POST: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ POST } = await import("@/app/api/budgets/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    categoryName: "Food & Dining",
    month: 3,
    year: 2026,
    budgetAmount: 500,
  };

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const { status } = await parseResponse(
      await POST(makeRequest("POST", "http://localhost/api/budgets", validBody))
    );
    expect(status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    const { status } = await parseResponse(
      await POST(
        makeRequest("POST", "http://localhost/api/budgets", {
          categoryName: "Food & Dining",
        })
      )
    );
    expect(status).toBe(400);
  });

  it("upserts and returns the budget on success", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.category.upsert.mockResolvedValueOnce({ categoryId: 5 });
    mockPrisma.budget.upsert.mockResolvedValueOnce({
      budgetId: 1,
      categoryId: 5,
      category: { categoryName: "Food & Dining" },
      month: 3,
      year: 2026,
      budgetAmount: 500,
    });

    const { status, data } = await parseResponse(
      await POST(makeRequest("POST", "http://localhost/api/budgets", validBody))
    );

    expect(status).toBe(201);
    expect(data.data).toMatchObject({
      categoryName: "Food & Dining",
      budgetAmount: 500,
      month: 3,
      year: 2026,
    });
  });

  it("upserts the category before creating the budget", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.category.upsert.mockResolvedValueOnce({ categoryId: 7 });
    mockPrisma.budget.upsert.mockResolvedValueOnce({
      budgetId: 2,
      categoryId: 7,
      category: { categoryName: "Travel" },
      month: 4,
      year: 2026,
      budgetAmount: 800,
    });

    await POST(
      makeRequest("POST", "http://localhost/api/budgets", {
        ...validBody,
        categoryName: "Travel",
        budgetAmount: 800,
      })
    );

    expect(mockPrisma.category.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryName: "Travel" } })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/ai/categorize  (POST)
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/ai/categorize", () => {
  let POST: (req: Request) => Promise<Response>;
  beforeAll(async () => {
    ({ POST } = await import("@/app/api/ai/categorize/route"));
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const { status } = await parseResponse(
      await POST(
        makeRequest("POST", "http://localhost/api/ai/categorize", {
          expenseName: "Coffee",
        })
      )
    );
    expect(status).toBe(401);
  });

  it("returns 400 when expenseName is missing", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    const { status } = await parseResponse(
      await POST(makeRequest("POST", "http://localhost/api/ai/categorize", {}))
    );
    expect(status).toBe(400);
  });

  it("returns the AI suggestion with matched category id", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.category.findMany.mockResolvedValueOnce([
      { categoryId: 1, categoryName: "Food & Dining" },
      { categoryId: 2, categoryName: "Transportation" },
    ]);
    mockCategorizeExpense.mockResolvedValueOnce({
      category: "Food & Dining",
      confidence: 0.97,
    });

    const { status, data } = await parseResponse(
      await POST(
        makeRequest("POST", "http://localhost/api/ai/categorize", {
          expenseName: "Lunch at restaurant",
        })
      )
    );

    expect(status).toBe(200);
    expect(data.data).toMatchObject({
      suggestedCategory: "Food & Dining",
      categoryId: 1,
      confidence: 0.97,
    });
  });

  it("passes all existing category names to the AI helper", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.category.findMany.mockResolvedValueOnce([
      { categoryId: 1, categoryName: "Food & Dining" },
      { categoryId: 2, categoryName: "Shopping" },
    ]);
    mockCategorizeExpense.mockResolvedValueOnce({
      category: "Shopping",
      confidence: 0.9,
    });

    await POST(
      makeRequest("POST", "http://localhost/api/ai/categorize", {
        expenseName: "Amazon order",
      })
    );

    expect(mockCategorizeExpense).toHaveBeenCalledWith(
      "Amazon order",
      undefined,
      ["Food & Dining", "Shopping"]
    );
  });

  it("returns categoryId as undefined when no category matches the suggestion", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.category.findMany.mockResolvedValueOnce([
      { categoryId: 1, categoryName: "Food & Dining" },
    ]);
    mockCategorizeExpense.mockResolvedValueOnce({
      category: "Healthcare", // not in the DB
      confidence: 0.8,
    });

    const { data } = await parseResponse(
      await POST(
        makeRequest("POST", "http://localhost/api/ai/categorize", {
          expenseName: "Dentist appointment",
        })
      )
    );

    expect(data.data.categoryId).toBeUndefined();
    expect(data.data.suggestedCategory).toBe("Healthcare");
  });

  it("returns 500 when the AI helper throws", async () => {
    mockGetServerSession.mockResolvedValueOnce(authenticatedSession());
    mockPrisma.category.findMany.mockResolvedValueOnce([]);
    mockCategorizeExpense.mockRejectedValueOnce(new Error("AI service down"));

    const { status } = await parseResponse(
      await POST(
        makeRequest("POST", "http://localhost/api/ai/categorize", {
          expenseName: "Something",
        })
      )
    );

    expect(status).toBe(500);
  });
});
