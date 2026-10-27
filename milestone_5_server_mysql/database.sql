-- database.sql
-- Creates the database and the one table used by The Sifted Cafe & Bakery.
-- Run it in MySQL Workbench (File > Open SQL Script, then click the lightning bolt).
-- It is safe to run more than once: it never deletes existing reservations.
-- (If you already ran an OLDER version of this script, also run database_update.sql once.)

CREATE DATABASE IF NOT EXISTS sifted_cafe_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sifted_cafe_db;

CREATE TABLE IF NOT EXISTS reservations (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_name    VARCHAR(100) NOT NULL,
  phone            VARCHAR(30)  NOT NULL,
  email            VARCHAR(150) NULL,
  branch           VARCHAR(20)  NOT NULL,              -- 'calamba' or 'cabuyao'
  reservation_date DATE         NOT NULL,
  reservation_time TIME         NOT NULL,
  guests           TINYINT UNSIGNED NOT NULL,
  occasion         VARCHAR(100) NULL,                  -- birthday, meeting...
  allergies        VARCHAR(300) NULL,                  -- allergies or special needs
  special_requests VARCHAR(500) NULL,
  status           ENUM('pending','confirmed','cancelled','completed','no_show')
                   NOT NULL DEFAULT 'pending',         -- new requests start as pending
  admin_notes      VARCHAR(1000) NULL,                  -- private notes for staff
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_date_time (reservation_date, reservation_time),
  INDEX idx_status (status),
  CONSTRAINT chk_guests CHECK (guests BETWEEN 1 AND 20)
) ENGINE=InnoDB;

-- Quick check: this should show the (empty) table.
SELECT COUNT(*) AS total_reservations FROM reservations;
