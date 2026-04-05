-- GDPS — Digital Game Distribution Platform
-- MySQL 8.x InnoDB | Aligned with SDD v1.0 (USER, GAME, DEVELOPER, PUBLISHER,
-- PURCHASE, PAYMENT, USER_LIBRARY/OWNS, REVIEW, OFFER)
-- Entity USER implemented as `users` (reserved word avoidance).

SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS gdps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gdps;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS offers;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS user_library;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS developers;
DROP TABLE IF EXISTS publishers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  country VARCHAR(50) NOT NULL,
  role ENUM('Admin','Developer','Publisher','Consumer') NOT NULL DEFAULT 'Consumer',
  join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE developers (
  developer_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  developer_name VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,
  PRIMARY KEY (developer_id),
  KEY idx_developers_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN developer_id INT UNSIGNED NULL AFTER role,
  ADD UNIQUE KEY uq_users_developer_id (developer_id),
  ADD CONSTRAINT fk_users_developer FOREIGN KEY (developer_id)
    REFERENCES developers (developer_id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE publishers (
  publisher_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  publisher_name VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,
  PRIMARY KEY (publisher_id),
  KEY idx_publishers_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN publisher_id INT UNSIGNED NULL AFTER developer_id,
  ADD UNIQUE KEY uq_users_publisher_id (publisher_id),
  ADD CONSTRAINT fk_users_publisher FOREIGN KEY (publisher_id)
    REFERENCES publishers (publisher_id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE games (
  game_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  release_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  developer_id INT UNSIGNED NOT NULL,
  publisher_id INT UNSIGNED NULL,
  cover_url VARCHAR(500) NULL,
  PRIMARY KEY (game_id),
  KEY idx_games_title (title),
  KEY idx_games_price (price),
  KEY idx_games_category (category),
  KEY idx_games_developer (developer_id),
  CONSTRAINT fk_games_developer FOREIGN KEY (developer_id)
    REFERENCES developers (developer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_games_publisher FOREIGN KEY (publisher_id)
    REFERENCES publishers (publisher_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_games_price_positive CHECK (price > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE offers (
  offer_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id INT UNSIGNED NOT NULL,
  starting_date DATETIME NOT NULL,
  ending_date DATETIME NOT NULL,
  percentage_off DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (offer_id),
  KEY idx_offers_game (game_id),
  KEY idx_offers_active (starting_date, ending_date),
  CONSTRAINT fk_offers_game FOREIGN KEY (game_id)
    REFERENCES games (game_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_offers_pct CHECK (percentage_off > 0 AND percentage_off <= 100),
  CONSTRAINT chk_offers_dates CHECK (ending_date > starting_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchases (
  purchase_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  price_paid DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (purchase_id),
  KEY idx_purchases_user (user_id),
  KEY idx_purchases_game (game_id),
  KEY idx_purchases_date (purchase_date),
  CONSTRAINT fk_purchases_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_purchases_game FOREIGN KEY (game_id)
    REFERENCES games (game_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_purchases_price CHECK (price_paid >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  payment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_id INT UNSIGNED NOT NULL,
  payment_method ENUM('CreditCard','PayPal','Wallet') NOT NULL,
  payment_status ENUM('Pending','Completed','Failed') NOT NULL DEFAULT 'Pending',
  transaction_id VARCHAR(100) NULL,
  PRIMARY KEY (payment_id),
  UNIQUE KEY uq_payments_purchase (purchase_id),
  UNIQUE KEY uq_payments_txn (transaction_id),
  CONSTRAINT fk_payments_purchase FOREIGN KEY (purchase_id)
    REFERENCES purchases (purchase_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USER_LIBRARY (OWNS in SDD): one row per owned game; created atomically with purchase.
CREATE TABLE user_library (
  library_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  added_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  playtime_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_played DATETIME NULL,
  download_completed_at DATETIME NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Purchased',
  PRIMARY KEY (library_id),
  UNIQUE KEY uq_library_user_game (user_id, game_id),
  KEY idx_library_user (user_id),
  KEY idx_library_game (game_id),
  CONSTRAINT fk_library_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_library_game FOREIGN KEY (game_id)
    REFERENCES games (game_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  review_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review_text TEXT NOT NULL,
  review_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  UNIQUE KEY uq_review_user_game (user_id, game_id),
  KEY idx_reviews_game (game_id),
  KEY idx_reviews_user (user_id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_game FOREIGN KEY (game_id)
    REFERENCES games (game_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
