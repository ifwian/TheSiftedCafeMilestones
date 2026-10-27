-- database_update.sql
-- Only for people who created the table with the OLDER database.sql (before the cafe interview).
-- It adds the two new columns: occasion and allergies. Your existing reservations are kept.
-- Run it ONCE in MySQL Workbench. (If you run it twice, MySQL says "Duplicate column name": that is harmless.)
-- New installs do NOT need this file: database.sql already has the columns.

USE sifted_cafe_db;

ALTER TABLE reservations ADD COLUMN occasion  VARCHAR(100) NULL AFTER guests;
ALTER TABLE reservations ADD COLUMN allergies VARCHAR(300) NULL AFTER occasion;

SELECT COUNT(*) AS total_reservations FROM reservations;
