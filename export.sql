-- MySQL dump 10.13  Distrib 8.0.43, for macos15 (arm64)
--
-- Host: localhost    Database: expense_tracker
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `budget`
--

DROP TABLE IF EXISTS `budget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget` (
  `budget_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `month` tinyint NOT NULL,
  `year` smallint NOT NULL,
  `budget_amount` decimal(12,2) NOT NULL,
  PRIMARY KEY (`budget_id`),
  UNIQUE KEY `uq_budget_period` (`user_id`,`category_id`,`month`,`year`),
  KEY `idx_budget_user_id` (`user_id`),
  KEY `idx_budget_category_id` (`category_id`),
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_budget_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_budget_amount` CHECK ((`budget_amount` > 0)),
  CONSTRAINT `chk_budget_month` CHECK ((`month` between 1 and 12))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget`
--

LOCK TABLES `budget` WRITE;
/*!40000 ALTER TABLE `budget` DISABLE KEYS */;
INSERT INTO `budget` VALUES (1,1,4,3,2026,100.00);
/*!40000 ALTER TABLE `budget` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget_alert`
--

DROP TABLE IF EXISTS `budget_alert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_alert` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `budget_id` int NOT NULL,
  `alert_threshold` decimal(5,2) NOT NULL,
  `alert_date` date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`alert_id`),
  KEY `idx_budget_alert_budget_id` (`budget_id`),
  CONSTRAINT `fk_budget_alert_budget` FOREIGN KEY (`budget_id`) REFERENCES `budget` (`budget_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_alert_threshold` CHECK ((`alert_threshold` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_alert`
--

LOCK TABLES `budget_alert` WRITE;
/*!40000 ALTER TABLE `budget_alert` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_alert` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_name` (`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Test',NULL),(2,'Transportation',NULL),(3,'Grocery',NULL),(4,'Dues & Subscriptions',NULL),(15,'Travel','Flights, hotels, car rentals, and other travel-related expenses'),(16,'Meals & Entertainment','Business meals, client dinners, and entertainment costs'),(17,'Office Supplies','Stationery, printer ink, and general office consumables'),(18,'Software & Subscriptions','SaaS tools, licenses, and recurring software subscriptions'),(19,'Utilities','Internet, phone, electricity, and other utility bills'),(20,'Equipment','Hardware, machinery, and other capital equipment purchases'),(21,'Marketing & Advertising','Ad spend, promotional materials, and marketing services'),(22,'Professional Services','Legal, accounting, consulting, and contractor fees'),(23,'Training & Education','Courses, certifications, books, and professional development'),(24,'Food & Dining',NULL),(25,'Shopping',NULL),(26,'Entertainment',NULL),(27,'Bills & Utilities',NULL),(28,'Healthcare',NULL),(29,'Education',NULL),(30,'Other',NULL),(31,'A new category',NULL);
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense`
--

DROP TABLE IF EXISTS `expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense` (
  `expense_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `vendor_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` int NOT NULL,
  `is_billable` tinyint(1) NOT NULL DEFAULT '0',
  `created_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`expense_id`),
  KEY `idx_expense_user_id` (`user_id`),
  KEY `idx_expense_category` (`category_id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_expense_user_date` (`user_id`,`expense_date`),
  CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_expense_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense`
--

LOCK TABLES `expense` WRITE;
/*!40000 ALTER TABLE `expense` DISABLE KEYS */;
INSERT INTO `expense` VALUES (2,1,'2026-03-31',20.00,'Test Expense','test description',1,0,'2026-03-31 22:45:36','2026-04-02 05:10:01'),(3,1,'2026-04-01',20.00,'Claude.ai',' subscription',4,0,'2026-04-01 06:43:51','2026-04-01 14:39:08'),(4,1,'2026-05-01',20.00,'Claude.ai',' subscription',4,0,'2026-04-01 06:58:16','2026-04-01 14:39:08'),(19,1,'2026-01-05',349.99,'Delta Airlines','Flight to client site in Atlanta',15,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(20,1,'2026-01-06',85.50,'Chilis','Client lunch meeting',16,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(21,1,'2026-01-10',42.00,'Staples','Printer paper and pens',17,0,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(22,1,'2026-01-15',299.00,'Adobe','Monthly Creative Cloud subscription',18,0,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(23,1,'2026-01-18',120.00,'AT&T','Monthly phone bill',19,0,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(24,1,'2026-01-20',55.75,'Uber','Ride to downtown client meeting',2,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(25,1,'2026-01-22',1200.00,'Best Buy','External monitor for home office',20,0,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(26,2,'2026-01-07',500.00,'Google Ads','January ad campaign spend',21,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(27,2,'2026-01-09',750.00,'LegalZoom','Contract review services',22,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(28,2,'2026-01-12',199.00,'Udemy','React advanced course license',23,0,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(29,2,'2026-01-14',67.30,'Shell','Gas for client site visit',2,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(30,2,'2026-01-19',215.00,'Marriott','Hotel stay for conference',15,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(31,2,'2026-01-25',38.90,'Office Depot','Notebooks and folders',17,0,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(32,2,'2026-01-28',49.99,'Slack','Monthly Slack Pro subscription',4,1,'2026-04-02 17:06:14','2026-04-02 17:06:14'),(33,1,'2026-01-08',12.50,'Kroger','Office snacks for team meeting',3,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(34,1,'2026-01-11',89.00,'Zoom','Monthly Zoom Pro subscription',4,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(35,1,'2026-01-13',450.00,'American Airlines','Flight to New York conference',15,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(36,1,'2026-01-16',210.00,'Hilton','Hotel stay for New York conference',15,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(37,1,'2026-01-17',34.20,'Shell','Gas for client site visit',2,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(38,1,'2026-01-21',150.00,'FedEx','Shipping equipment to client',22,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(39,1,'2026-01-23',79.99,'Microsoft','Microsoft 365 monthly subscription',18,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(40,1,'2026-01-24',62.40,'Outback Steakhouse','Team dinner',16,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(41,1,'2026-01-26',28.75,'Walmart','Grocery run for office kitchen',3,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(42,1,'2026-01-27',999.00,'Apple','iPad for field presentations',20,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(43,1,'2026-02-02',45.00,'Lyft','Ride to airport',2,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(44,1,'2026-02-04',320.00,'Southwest Airlines','Flight to Dallas client meeting',15,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(45,1,'2026-02-05',18.99,'Amazon','USB hub for laptop',17,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(46,1,'2026-02-07',175.00,'Courtyard Marriott','Hotel stay in Dallas',15,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(47,1,'2026-02-10',55.00,'Olive Garden','Client lunch',16,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(48,1,'2026-02-12',249.00,'Salesforce','CRM monthly subscription',4,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(49,1,'2026-02-14',33.60,'BP','Gas for site visit',2,1,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(50,1,'2026-02-17',89.50,'Office Depot','Whiteboard markers and notebooks',17,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(51,1,'2026-02-19',500.00,'Coursera','Project management certification',23,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(52,1,'2026-02-21',74.25,'Chick-fil-A','Team lunch',16,0,'2026-04-02 17:11:09','2026-04-02 17:11:09'),(53,2,'2026-01-03',149.99,'Amazon','Keyboard and mouse for home office',20,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(54,2,'2026-01-06',22.50,'Kroger','Snacks for team standup',3,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(55,2,'2026-01-08',89.00,'GitHub','GitHub Teams monthly subscription',4,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(56,2,'2026-01-10',310.00,'United Airlines','Flight to Chicago client meeting',15,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(57,2,'2026-01-11',185.00,'Hyatt','Hotel stay in Chicago',15,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(58,2,'2026-01-13',41.80,'Exxon','Gas for client site visit',2,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(59,2,'2026-01-16',64.75,'Texas de Brazil','Client dinner in Chicago',16,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(60,2,'2026-01-17',29.99,'Dropbox','Dropbox Plus monthly subscription',4,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(61,2,'2026-01-21',112.00,'Verizon','Monthly phone bill',19,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(62,2,'2026-01-23',375.00,'Meta Ads','Facebook ad campaign',21,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(63,2,'2026-01-26',55.00,'Panera Bread','Working lunch with contractor',16,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(64,2,'2026-01-29',899.00,'Dell','External hard drive and docking station',20,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(65,2,'2026-01-31',18.45,'Walgreens','Office first aid kit refill',17,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(66,2,'2026-02-03',249.00,'HubSpot','CRM monthly subscription',4,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(67,2,'2026-02-05',420.00,'Delta Airlines','Flight to Miami for conference',15,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(68,2,'2026-02-06',230.00,'Marriott','Hotel stay in Miami',15,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(69,2,'2026-02-08',77.30,'Uber','Airport rides in Miami',2,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(70,2,'2026-02-10',95.00,'Cheesecake Factory','Client dinner in Miami',16,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(71,2,'2026-02-12',599.00,'LinkedIn','LinkedIn Ads campaign spend',21,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(72,2,'2026-02-13',45.00,'Costco','Grocery run for office',3,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(73,2,'2026-02-15',199.00,'Pluralsight','Annual subscription for dev training',23,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(74,2,'2026-02-17',33.00,'Circle K','Gas for client visit',2,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(75,2,'2026-02-19',125.00,'Staples','Printer cartridges and paper reams',17,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(76,2,'2026-02-21',350.00,'Upwork','Freelance contractor payment',22,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(77,2,'2026-02-24',59.99,'Notion','Notion Pro monthly subscription',4,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(78,2,'2026-02-26',88.40,'Applebees','Team lunch',16,0,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(79,2,'2026-02-28',475.00,'Google Ads','February ad campaign spend',21,1,'2026-04-02 17:12:20','2026-04-02 17:12:20'),(80,1,'2026-04-02',20.00,'Another Test Expense',NULL,4,0,'2026-04-02 22:30:54','2026-04-02 22:30:54');
/*!40000 ALTER TABLE `expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_tag`
--

DROP TABLE IF EXISTS `expense_tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_tag` (
  `expense_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`expense_id`,`tag_id`),
  KEY `idx_expense_tag_tag_id` (`tag_id`),
  CONSTRAINT `fk_expense_tag_expense` FOREIGN KEY (`expense_id`) REFERENCES `expense` (`expense_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_expense_tag_tag` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`tag_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_tag`
--

LOCK TABLES `expense_tag` WRITE;
/*!40000 ALTER TABLE `expense_tag` DISABLE KEYS */;
INSERT INTO `expense_tag` VALUES (4,1);
/*!40000 ALTER TABLE `expense_tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `export`
--

DROP TABLE IF EXISTS `export`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export` (
  `export_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `export_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `export_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`export_id`),
  KEY `idx_export_user_id` (`user_id`),
  CONSTRAINT `fk_export_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_export_dates` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `export`
--

LOCK TABLES `export` WRITE;
/*!40000 ALTER TABLE `export` DISABLE KEYS */;
INSERT INTO `export` VALUES (1,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:12:34'),(2,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:13:41'),(3,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:14:46'),(4,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:14:52'),(5,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:14:56'),(6,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:15:21'),(7,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:15:57'),(8,1,'pdf','2026-03-01','2026-04-01','2026-04-01 07:28:19'),(9,1,'pdf','2026-04-01','2026-04-02','2026-04-02 21:44:32'),(10,1,'pdf','2026-04-01','2026-04-02','2026-04-02 22:31:15'),(11,1,'pdf','2026-04-01','2026-04-02','2026-04-02 22:55:58'),(12,1,'pdf','2026-03-01','2026-03-31','2026-04-02 22:56:09');
/*!40000 ALTER TABLE `export` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt`
--

DROP TABLE IF EXISTS `receipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt` (
  `receipt_id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `image_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `upload_date` date NOT NULL DEFAULT (curdate()),
  `extracted_amount` decimal(12,2) DEFAULT NULL,
  `extracted_vendor` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`receipt_id`),
  KEY `idx_receipt_expense_id` (`expense_id`),
  CONSTRAINT `fk_receipt_expense` FOREIGN KEY (`expense_id`) REFERENCES `expense` (`expense_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt`
--

LOCK TABLES `receipt` WRITE;
/*!40000 ALTER TABLE `receipt` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spending_chart`
--

DROP TABLE IF EXISTS `spending_chart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spending_chart` (
  `chart_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `time_period` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_spent` decimal(14,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`chart_id`),
  UNIQUE KEY `uq_chart_category_period` (`category_id`,`time_period`),
  KEY `idx_spending_chart_category` (`category_id`),
  CONSTRAINT `fk_spending_chart_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spending_chart`
--

LOCK TABLES `spending_chart` WRITE;
/*!40000 ALTER TABLE `spending_chart` DISABLE KEYS */;
/*!40000 ALTER TABLE `spending_chart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag` (
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tag_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`tag_id`),
  KEY `idx_tag_user_id` (`user_id`),
  CONSTRAINT `fk_tag_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tag`
--

LOCK TABLES `tag` WRITE;
/*!40000 ALTER TABLE `tag` DISABLE KEYS */;
INSERT INTO `tag` VALUES (1,1,'school','custom');
/*!40000 ALTER TABLE `tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_created_date` date NOT NULL DEFAULT (curdate()),
  `date_retention_years` tinyint NOT NULL DEFAULT '7',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'User','user@test.com','2026-03-31',7,'$2b$10$jEFCaFZnv.5CABLyF/QkqeOKAZBNlQAdw7RxrDlcFOMLwoApq9Ey2'),(2,'Calvin James ','cejames@mail.lipscomb.edu','2026-03-31',7,'$2b$10$g7LOo8PVc73c2BRAlRJzO.ASUlYEyyUCyuzvqCKQ/gmJjB./PYV3m'),(3,'Raquel Lester','rdlester523@gmail.com','2026-04-05',7,'$2b$10$Hpe8OhwRAhzag6AgcJeAxu2Kqnd8KKeDR0CjtNkdriX/q3xvdz1ba');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-07 12:11:27
