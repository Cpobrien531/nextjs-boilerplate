-- CreateTable
CREATE TABLE "user" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "account_created_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_retention_years" INTEGER NOT NULL DEFAULT 7,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "category" (
    "category_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_name" TEXT NOT NULL,
    "category_description" TEXT
);

-- CreateTable
CREATE TABLE "expense" (
    "expense_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "expense_date" DATETIME NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "vendor_name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "is_billable" BOOLEAN NOT NULL DEFAULT false,
    "created_timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "expense_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("category_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "receipt" (
    "receipt_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "expense_id" INTEGER NOT NULL,
    "image_path" TEXT NOT NULL,
    "upload_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extracted_amount" DECIMAL,
    "extracted_vendor" TEXT,
    CONSTRAINT "receipt_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expense" ("expense_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tag" (
    "tag_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "tag_name" TEXT NOT NULL,
    "tag_type" TEXT NOT NULL,
    CONSTRAINT "tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expense_tag" (
    "expense_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    PRIMARY KEY ("expense_id", "tag_id"),
    CONSTRAINT "expense_tag_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expense" ("expense_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "expense_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag" ("tag_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget" (
    "budget_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "budget_amount" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "budget_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "budget_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("category_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_alert" (
    "alert_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "budget_id" INTEGER NOT NULL,
    "alert_threshold" DECIMAL NOT NULL DEFAULT 0,
    "alert_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "budget_alert_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budget" ("budget_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "export" (
    "export_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "export_format" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "export_timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "export_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spending_chart" (
    "chart_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_id" INTEGER NOT NULL,
    "time_period" TEXT NOT NULL,
    "total_spent" DECIMAL NOT NULL DEFAULT 0.00,
    CONSTRAINT "spending_chart_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("category_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "category_category_name_key" ON "category"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "budget_user_id_category_id_month_year_key" ON "budget"("user_id", "category_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "spending_chart_category_id_time_period_key" ON "spending_chart"("category_id", "time_period");
