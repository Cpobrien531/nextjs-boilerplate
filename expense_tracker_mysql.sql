-- ============================================================
--  Expense Tracker — Physical Design
--  Database: MySQL 8.0+
--  Generated from Logical Design
-- ============================================================

CREATE DATABASE IF NOT EXISTS expense_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE expense_tracker;

-- ============================================================
--  TABLE: user
-- ============================================================
CREATE TABLE user (
  user_id               INT             NOT NULL AUTO_INCREMENT,
  full_name             VARCHAR(150)    NOT NULL,
  email                 VARCHAR(255)    NOT NULL,
  account_created_date  DATE            NOT NULL DEFAULT (CURRENT_DATE),
  date_retention_years  TINYINT         NOT NULL DEFAULT 7,

  CONSTRAINT pk_user        PRIMARY KEY (user_id),
  CONSTRAINT uq_user_email  UNIQUE      (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Index: email lookups (login / lookup by email)
CREATE INDEX idx_user_email ON user (email);


-- ============================================================
--  TABLE: category
-- ============================================================
CREATE TABLE category (
  category_id          INT           NOT NULL AUTO_INCREMENT,
  category_name        VARCHAR(100)  NOT NULL,
  category_description TEXT          NULL,

  CONSTRAINT pk_category        PRIMARY KEY (category_id),
  CONSTRAINT uq_category_name   UNIQUE      (category_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  TABLE: expense
-- ============================================================
CREATE TABLE expense (
  expense_id              INT             NOT NULL AUTO_INCREMENT,
  user_id                 INT             NOT NULL,
  expense_date            DATE            NOT NULL,
  amount                  DECIMAL(12, 2)  NOT NULL,
  vendor_name             VARCHAR(200)    NOT NULL,
  description             TEXT            NULL,
  category_id             INT             NOT NULL,
  is_billable             TINYINT(1)      NOT NULL DEFAULT 0,
  created_timestamp       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified_timestamp TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_expense           PRIMARY KEY (expense_id),
  CONSTRAINT fk_expense_user      FOREIGN KEY (user_id)
    REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_expense_category  FOREIGN KEY (category_id)
    REFERENCES category (category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Indexes: common query patterns
CREATE INDEX idx_expense_user_id    ON expense (user_id);
CREATE INDEX idx_expense_category   ON expense (category_id);
CREATE INDEX idx_expense_date       ON expense (expense_date);
CREATE INDEX idx_expense_user_date  ON expense (user_id, expense_date);


-- ============================================================
--  TABLE: receipt
-- ============================================================
CREATE TABLE receipt (
  receipt_id        INT           NOT NULL AUTO_INCREMENT,
  expense_id        INT           NOT NULL,
  image_path        VARCHAR(500)  NOT NULL,
  upload_date       DATE          NOT NULL DEFAULT (CURRENT_DATE),
  extracted_amount  DECIMAL(12,2) NULL,
  extracted_vendor  VARCHAR(200)  NULL,

  CONSTRAINT pk_receipt          PRIMARY KEY (receipt_id),
  CONSTRAINT fk_receipt_expense  FOREIGN KEY (expense_id)
    REFERENCES expense (expense_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_receipt_expense_id ON receipt (expense_id);


-- ============================================================
--  TABLE: tag
-- ============================================================
CREATE TABLE tag (
  tag_id    INT           NOT NULL AUTO_INCREMENT,
  user_id   INT           NOT NULL,
  tag_name  VARCHAR(100)  NOT NULL,
  tag_type  VARCHAR(50)   NOT NULL,

  CONSTRAINT pk_tag       PRIMARY KEY (tag_id),
  CONSTRAINT fk_tag_user  FOREIGN KEY (user_id)
    REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tag_user_id ON tag (user_id);


-- ============================================================
--  TABLE: expense_tag  (junction — resolves many-to-many)
-- ============================================================
CREATE TABLE expense_tag (
  expense_id  INT  NOT NULL,
  tag_id      INT  NOT NULL,

  CONSTRAINT pk_expense_tag         PRIMARY KEY (expense_id, tag_id),
  CONSTRAINT fk_expense_tag_expense FOREIGN KEY (expense_id)
    REFERENCES expense (expense_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_expense_tag_tag     FOREIGN KEY (tag_id)
    REFERENCES tag (tag_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_expense_tag_tag_id ON expense_tag (tag_id);


-- ============================================================
--  TABLE: budget
-- ============================================================
CREATE TABLE budget (
  budget_id      INT            NOT NULL AUTO_INCREMENT,
  user_id        INT            NOT NULL,
  category_id    INT            NOT NULL,
  month          TINYINT        NOT NULL,
  year           SMALLINT       NOT NULL,
  budget_amount  DECIMAL(12,2)  NOT NULL,

  CONSTRAINT pk_budget            PRIMARY KEY (budget_id),
  CONSTRAINT uq_budget_period     UNIQUE      (user_id, category_id, month, year),
  CONSTRAINT fk_budget_user       FOREIGN KEY (user_id)
    REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_budget_category   FOREIGN KEY (category_id)
    REFERENCES category (category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_budget_month     CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT chk_budget_amount    CHECK (budget_amount > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_budget_user_id     ON budget (user_id);
CREATE INDEX idx_budget_category_id ON budget (category_id);


-- ============================================================
--  TABLE: budget_alert
-- ============================================================
CREATE TABLE budget_alert (
  alert_id         INT            NOT NULL AUTO_INCREMENT,
  budget_id        INT            NOT NULL,
  alert_threshold  DECIMAL(5, 2)  NOT NULL,
  alert_date       DATE           NOT NULL DEFAULT (CURRENT_DATE),

  CONSTRAINT pk_budget_alert        PRIMARY KEY (alert_id),
  CONSTRAINT fk_budget_alert_budget FOREIGN KEY (budget_id)
    REFERENCES budget (budget_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_alert_threshold    CHECK (alert_threshold BETWEEN 0 AND 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_budget_alert_budget_id ON budget_alert (budget_id);


-- ============================================================
--  TABLE: export
-- ============================================================
CREATE TABLE export (
  export_id        INT           NOT NULL AUTO_INCREMENT,
  user_id          INT           NOT NULL,
  export_format    VARCHAR(20)   NOT NULL,
  start_date       DATE          NOT NULL,
  end_date         DATE          NOT NULL,
  export_timestamp TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_export        PRIMARY KEY (export_id),
  CONSTRAINT fk_export_user   FOREIGN KEY (user_id)
    REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_export_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_export_user_id ON export (user_id);


-- ============================================================
--  TABLE: spending_chart
-- ============================================================
CREATE TABLE spending_chart (
  chart_id     INT            NOT NULL AUTO_INCREMENT,
  category_id  INT            NOT NULL,
  time_period  VARCHAR(20)    NOT NULL,
  total_spent  DECIMAL(14,2)  NOT NULL DEFAULT 0.00,

  CONSTRAINT pk_spending_chart          PRIMARY KEY (chart_id),
  CONSTRAINT uq_chart_category_period   UNIQUE      (category_id, time_period),
  CONSTRAINT fk_spending_chart_category FOREIGN KEY (category_id)
    REFERENCES category (category_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_spending_chart_category ON spending_chart (category_id);

-- ============================================================
--  END OF SCRIPT
-- ============================================================
