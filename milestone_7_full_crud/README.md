# Milestone 7: Full CRUD (edit, status, delete)

The dashboard is complete: staff can **edit**, **change the status** and **delete** (with confirmation). Every change is saved in MySQL. This is the same code as the finished project, before the final tests and documentation of Milestone 8.

## How to run this milestone (Windows + VS Code)

1. Install **Node.js** (LTS), **MySQL Server** and **MySQL Workbench** if you have not yet.
2. Open this folder in VS Code (*File, Open Folder*), then open a terminal (*Terminal, New Terminal*).
3. Install the libraries:
   ```
   npm install
   ```
4. In **MySQL Workbench**: open your local connection, *File, Open SQL Script...*, choose `database.sql`, click the **lightning bolt**. Refresh the Schemas panel: you should see `sifted_cafe_db` and the `reservations` table.
5. Copy `.env.example` to a new file named `.env` and fill it in (your MySQL password and the staff login (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)).
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

- `server/server.js`: + `PUT /api/admin/reservations/:id` (edit), `PATCH .../status`, `DELETE ...`
- `public/admin.html` and `public/js/admin.js`: the Edit window, status buttons, and the Delete confirmation
- Same validation rules for staff edits (but staff may use past dates and any time), plus status and private notes

## What to show your professor (demo steps)

1. Sign in, open a reservation with **View**, press **Confirm**. The badge and the count cards change.
2. **Edit**: type 99 guests and Save: the **server** sends back a field error and the window shows it under the field. Fix it and save.
3. Refresh the page: the change is still there. In Workbench run the SELECT: the row in MySQL changed (and `updated_at` moved).
4. **Delete**: the window asks first. "Keep it" keeps the row. "Yes, delete" removes it. Refresh, and check Workbench: it is gone.
5. Try the status filter and the count cards after your changes.
6. Optional: stop MySQL and press a button: a friendly error, no crash.

## What is NOT done yet (say this openly)

- Automatic API tests and the complete documentation (Milestone 8).
- Known limits: one shared admin account, sessions in memory, no table-availability check, no pagination.

## What to say (talking points)

- CRUD in this project: Create = INSERT (public form), Read = SELECT (list and View), Update = UPDATE (Edit and status), Delete = DELETE.
- All SQL uses `?` placeholders. The only text put in SQL directly is the `ORDER BY`, and it comes from a fixed list in our code.
- After a change the page reloads the data from the server, so what you see is what MySQL holds.
- Deleting needs a confirmation window because it cannot be undone.

## Questions your professor may ask

**How do you update only the status?**
`PATCH /api/admin/reservations/:id/status` runs `UPDATE reservations SET status = ? WHERE id = ?`.

**What happens if you delete a reservation that does not exist?**
The server checks `affectedRows`. If it is 0 it answers 404, and the page shows an error message.

**Why does the server validate an edit when staff are trusted?**
Mistakes happen, and the browser can be bypassed. The database should only receive valid data, whoever sends it.

## Honest note

AI (Claude) helped build this project. Be ready to explain every file in this milestone in your own words.
