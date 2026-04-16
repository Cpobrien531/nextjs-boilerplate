-- CreateTable
CREATE TABLE `user` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `account_created_date` DATE NOT NULL DEFAULT (curdate()),
    `date_retention_years` TINYINT NOT NULL DEFAULT 7,
    `password` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(100) NOT NULL,
    `category_description` TEXT NULL,

    UNIQUE INDEX `category_category_name_key`(`category_name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense` (
    `expense_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `expense_date` DATE NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `vendor_name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `category_id` INTEGER NOT NULL,
    `is_billable` BOOLEAN NOT NULL DEFAULT false,
    `created_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_modified_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `expense_category_id_fkey`(`category_id`),
    INDEX `expense_user_id_fkey`(`user_id`),
    PRIMARY KEY (`expense_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receipt` (
    `receipt_id` INTEGER NOT NULL AUTO_INCREMENT,
    `expense_id` INTEGER NOT NULL,
    `image_path` VARCHAR(500) NOT NULL,
    `upload_date` DATE NOT NULL DEFAULT (curdate()),
    `extracted_amount` DECIMAL(12, 2) NULL,
    `extracted_vendor` VARCHAR(200) NULL,

    INDEX `receipt_expense_id_fkey`(`expense_id`),
    PRIMARY KEY (`receipt_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tag` (
    `tag_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `tag_name` VARCHAR(100) NOT NULL,
    `tag_type` VARCHAR(50) NOT NULL,

    INDEX `tag_user_id_fkey`(`user_id`),
    PRIMARY KEY (`tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_tag` (
    `expense_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,

    INDEX `expense_tag_tag_id_fkey`(`tag_id`),
    PRIMARY KEY (`expense_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget` (
    `budget_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `month` TINYINT NOT NULL,
    `year` SMALLINT NOT NULL,
    `budget_amount` DECIMAL(12, 2) NOT NULL,

    INDEX `budget_category_id_fkey`(`category_id`),
    UNIQUE INDEX `budget_user_id_category_id_month_year_key`(`user_id`, `category_id`, `month`, `year`),
    PRIMARY KEY (`budget_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_alert` (
    `alert_id` INTEGER NOT NULL AUTO_INCREMENT,
    `budget_id` INTEGER NOT NULL,
    `alert_threshold` DECIMAL(5, 2) NOT NULL,
    `alert_date` DATE NOT NULL DEFAULT (curdate()),

    INDEX `budget_alert_budget_id_fkey`(`budget_id`),
    PRIMARY KEY (`alert_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `export` (
    `export_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `export_format` VARCHAR(20) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `export_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `export_user_id_fkey`(`user_id`),
    PRIMARY KEY (`export_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spending_chart` (
    `chart_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `time_period` VARCHAR(20) NOT NULL,
    `total_spent` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,

    UNIQUE INDEX `spending_chart_category_id_time_period_key`(`category_id`, `time_period`),
    PRIMARY KEY (`chart_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `expense` ADD CONSTRAINT `expense_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense` ADD CONSTRAINT `expense_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receipt` ADD CONSTRAINT `receipt_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `expense`(`expense_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tag` ADD CONSTRAINT `tag_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_tag` ADD CONSTRAINT `expense_tag_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `expense`(`expense_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_tag` ADD CONSTRAINT `expense_tag_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tag`(`tag_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `budget_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `budget_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_alert` ADD CONSTRAINT `budget_alert_budget_id_fkey` FOREIGN KEY (`budget_id`) REFERENCES `budget`(`budget_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `export` ADD CONSTRAINT `export_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spending_chart` ADD CONSTRAINT `spending_chart_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
