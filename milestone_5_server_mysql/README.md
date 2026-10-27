# Milestone 5: Express server and MySQL

The **real backend**. The fake server is gone. The public form now goes to Express, which checks the data again and saves it in **MySQL** as `pending`.

## How to run this milestone (Windows + VS Code)

1. Install **Node.js** (LTS), **MySQL Server** and **MySQL Workbench** if you have not yet.
2. Open this folder in VS Code (*File, Open Folder*), then open a terminal (*Terminal, New Terminal*).
3. Install the libraries:
   ```
   npm install
   ```
4. In **MySQL Workbench**: open your local connection, *File, Open SQL Script...*, choose `database.sql`, click the **lightning bolt**. Refresh the Schemas panel: you should see `sifted_cafe_db` and the `reservations` table.
5. Copy `.env.example` to a new file named `.env` and fill it in (your MySQL password).
6. Start the server:
   ```
   npm start
   ```
   Wait for `Database: connected`, then open **http://localhost:3000**.
7. Stop the server with `Ctrl + C`.

If something goes wrong, see "Common errors" in the final README (Milestone 8) or the table at the end of this file.

### Quick fixes

| You see | Do this |
| --- | --- |
| `Cannot find module 'express'` | Run `npm install` |
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` / `DB_PASSWORD` in `.env` |
| `ER_BAD_DB_ERROR` or `ER_NO_SUCH_TABLE` | Run `database.sql` in Workbench |
| `ECONNREFUSED ...:3306` | Start the MySQL service (Windows *Services*, `MySQL80`) |
| `EADDRINUSE` | Port 3000 is busy: close the old server or set `PORT=3001` in `.env` |

## What is new in this milestone

- `server/server.js`: the Express server (settings, MySQL pool, helpers, validation, the create route, static files, error handler)
- `database.sql`: creates `sifted_cafe_db` and the `reservations` table
- `package.json`, `.env.example`, `.gitignore`
- `tests/validation.test.js`: 20 automatic tests of the server rules (`npm test`)
- `database_update.sql`: only for people who created the table with an older `database.sql`
- The **cafe rules** from the manager interview, enforced on the server: hourly times per branch, 2 to 10 guests, 1 day notice, required email, 20 guests per slot, and the 6-month clean-up
- `public/`: same page as Milestone 3/4, but **without** `demo-api.js`: the same `fetch` now reaches the real server

## What to show your professor (demo steps)

1. Run the steps below. Open http://localhost:3000.
2. Send the form with wrong data: the **server** answers with field errors and the page shows them.
3. Send a correct request: success message with `SC-00001`, status **Pending**.
4. Open MySQL Workbench and run:
   ```sql
   SELECT id, customer_name, branch, reservation_date, reservation_time, guests, status
   FROM sifted_cafe_db.reservations;
   ```
   The row is there with `status = pending`. **This is the proof that data is saved for real.**
5. Restart the server (Ctrl+C, `npm start`) and run the SELECT again: the data is still there.
6. Capacity: book 10 guests and then 8 guests for the same branch, date and time, then try 3 more: the server answers "only 2 seats left" (status 409). The limit is 20 guests per time slot per branch.
7. Run `npm test`: 20 tests pass.
8. Open http://localhost:3000/api/health: `{"status":"ok","database":"connected"}`.
9. Optional: stop the MySQL service and send the form: a friendly "temporarily unavailable" message, not a crash.

## What is NOT done yet (say this openly)

- No staff login and no dashboard: to see the data we use MySQL Workbench. (`/login` and the staff API return 404 on purpose.)
- No edit, status change or delete yet.

## What to say (talking points)

- Express routes: "when a POST arrives at `/api/reservations`, run this function".
- Validation again on the server, because the browser can be bypassed.
- SQL uses `?` placeholders, so typed text can never become SQL (no SQL injection).
- A connection pool reuses database connections. Passwords come from `.env`, which is not in Git.
- The status is written as `'pending'` by the server; a customer cannot choose it.
- Extras: honeypot field, 10 requests / 15 min / address limit, security headers.
- The rules come from the manager interview. The server counts guests already booked (pending + confirmed) and refuses a request that would go over 20. Records older than 6 months are deleted when the server starts and once a day.

## Questions your professor may ask

**What is Express?**
A small Node library for building servers: you define routes and what to do for each.

**What is SQL injection and how do you stop it?**
Typing SQL into a field to trick the database. We stop it with `?` placeholders: values travel separately from the SQL text.

**Why is `.env` not in Git?**
It holds passwords. `.env.example` shows the names without the secrets.

**How does the capacity check work?**
Before saving, the server runs `SELECT SUM(guests) ... WHERE branch = ? AND date = ? AND time = ? AND status IN (pending, confirmed)`. If that sum plus the new guests is more than 20, it answers 409. Two requests at the very same moment could both pass; a database transaction would fix that.

**Why is the page code the same as before?**
It always called `fetch("/api/reservations")`. Only the thing answering changed: fake server before, Express now.

## Honest note

AI (Claude) helped build this project. Be ready to explain every file in this milestone in your own words.
