# 03. Database Design (draft)

Database name: **`sifted_cafe_db`**. One table is enough for this project: **`reservations`**.

Why one table? A reservation is one self-contained record. We do not store customer accounts (customers do not log in), so there is nothing to link to. Keeping it to one table makes the CRUD easy to explain.

## Columns

| Column | Type | Required | Meaning / rule |
| --- | --- | --- | --- |
| `id` | INT, auto increment, **primary key** | yes | Unique number. The reference shown to users is `SC-` + id (for example `SC-00012`) |
| `customer_name` | VARCHAR(100) | yes | Letters, spaces, apostrophes, hyphens |
| `phone` | VARCHAR(30) | yes | 7 to 15 digits |
| `email` | VARCHAR(150) | no (in the table) | **Required in the form** for customers; the column allows empty so older records and staff edits are fine |
| `branch` | VARCHAR(20) | yes | `calamba` or `cabuyao` |
| `reservation_date` | DATE | yes | At least tomorrow (1 day notice), up to 60 days ahead (assumed) |
| `reservation_time` | TIME | yes | One whole hour inside the branch hours: Calamba 10:00 to 21:00, Cabuyao 9:00 to 20:00 |
| `guests` | TINYINT | yes | Online 2 to 10; staff may enter 1 to 20 (the database `CHECK` allows 1 to 20) |
| `occasion` | VARCHAR(100) | no | Birthday, meeting... (asked in the interview) |
| `allergies` | VARCHAR(300) | no | Allergies or special needs (asked in the interview) |
| `special_requests` | VARCHAR(500) | no | Free text |
| `status` | ENUM | yes | `pending` (default), `confirmed`, `cancelled`, `completed`, `no_show` |
| `admin_notes` | VARCHAR(1000) | no | Private notes for staff |
| `created_at` | TIMESTAMP | yes | Filled by MySQL when the row is created |
| `updated_at` | TIMESTAMP | yes | Updated by MySQL on every change |

Indexes: `(reservation_date, reservation_time)` for sorting by date, and `(status)` for the status filter and counts.

## Status life cycle

```
                 +-----------+   staff confirms   +-----------+   guest came   +-----------+
 customer sends  |  pending  | -----------------> | confirmed | -------------> | completed |
 the form  ----> +-----------+                    +-----------+                +-----------+
                      |                               |   |
                      | staff cancels                 |   | guest did not come
                      v                               |   v
                 +-----------+  <-------------------- +   +-----------+
                 | cancelled |                            |  no_show  |
                 +-----------+                            +-----------+
```
Staff may also move a reservation to any other status (for example to fix a mistake).

## Example rows

| id | customer_name | branch | reservation_date | reservation_time | guests | status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Ana Dela Cruz | calamba | 2026-10-27 | 12:00:00 | 2 | pending |
| 2 | Ben Santos | cabuyao | 2026-10-29 | 18:30:00 | 5 | confirmed |

## Draft SQL (the final, tested version is `database.sql` in Milestone 5)

```sql
CREATE DATABASE IF NOT EXISTS sifted_cafe_db;
USE sifted_cafe_db;

CREATE TABLE IF NOT EXISTS reservations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  -- ...the rest of the columns from the table above
  status ENUM('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending'
);
```

## CRUD and SQL map (plan)

| CRUD | SQL we will use |
| --- | --- |
| Create | `INSERT INTO reservations (...) VALUES (?, ?, ...)` |
| Read | `SELECT ... FROM reservations WHERE ... ORDER BY ...` and `WHERE id = ?` |
| Update | `UPDATE reservations SET ... WHERE id = ?` |
| Delete | `DELETE FROM reservations WHERE id = ?` |
| Counts | `SELECT status, COUNT(*) FROM reservations GROUP BY status` |
| Capacity check | `SELECT SUM(guests) FROM reservations WHERE branch = ? AND reservation_date = ? AND reservation_time = ? AND status IN ('pending','confirmed')` |
| 6-month clean-up | `DELETE FROM reservations WHERE reservation_date < ?` (cut-off date worked out in JavaScript) |
