# Milestone 6: Staff login, sessions and a read-only dashboard

Staff can **sign in for real** and **see the reservations from MySQL**: counts, search, filters, and View. They cannot edit or delete yet. Visitors are blocked.

## How to run this milestone (Windows + VS Code)

1. Install **Node.js** (LTS), **MySQL Server** and **MySQL Workbench** if you have not yet.
2. Open this folder in VS Code (*File, Open Folder*), then open a terminal (*Terminal, New Terminal*).
3. Install the libraries:
   ```
   npm install
   ```
4. In **MySQL Workbench**: open your local connection, *File, Open SQL Script...*, choose `database.sql`, click the **lightning bolt**. Refresh the Schemas panel: you should see `sifted_cafe_db` and the `reservations` table.
5. Copy `.env.example` to a new file named `.env` and fill it in (your MySQL password and the staff login: `ADMIN_USERNAME` and `ADMIN_PASSWORD`).
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

- `server/server.js`: + login/logout, sessions (in memory), the guard on `/api/admin`, the staff READ routes (summary, list, one), and the `/login` and `/admin` pages
- `public/login.html`, `public/js/login.js`: the real sign-in page
- `public/admin.html`, `public/js/admin.js`: the dashboard, **view only** (View button; no Edit/Delete)
- `.env.example`: now has `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- `index.html`: "Staff login" link in the footer

## What to show your professor (demo steps)

1. Open http://localhost:3000/admin in a **private window**: you are sent to `/login`.
2. Open http://localhost:3000/api/admin/reservations in the private window: `{"error":"Please sign in."}` (401).
3. Wrong password: error. Correct password (from your `.env`): dashboard opens with your username.
4. Make a reservation on the public page: it appears in the dashboard, counts update.
5. Search, filter, sort, click a count card, **View** a reservation.
6. Press F12, *Application, Cookies*: the `sifted_admin` cookie is **HttpOnly** (JavaScript cannot read it) and **SameSite=Strict**.
7. **Sign out**, press Back, refresh: the data is not shown again.
8. Restart the server: you are signed out (sessions are in memory). Say this honestly: it is a known limitation.

## What is NOT done yet (say this openly)

- No Edit, no status change, no Delete: the routes do not exist yet (they answer 404 on purpose).
- Security limits of the school setup: one shared account from `.env`, sessions in memory, no HTTPS on localhost.

## What to say (talking points)

- The password is compared on the **server** with the value in `.env`. It is never in browser code.
- After a correct login the server creates a random token, stores it in memory for 8 hours and sends it in an **HttpOnly, SameSite=Strict** cookie.
- One guard, `app.use("/api/admin", ...)`, protects every staff route: no valid session means 401.
- Hiding a button in the browser is not security. The server check is.
- The comparison uses `crypto.timingSafeEqual` and the error message is the same for a wrong user or password.

## Questions your professor may ask

**What is a session?**
The server's memory that "this browser is signed in". The browser carries a random token in a cookie, the server looks it up on every request.

**What does HttpOnly do?**
JavaScript on the page cannot read the cookie, so injected code cannot steal the login.

**Why is this login not enough for a real business?**
One shared account, no hashed passwords per user, sessions lost on restart, no HTTPS. A real system needs a users table with bcrypt, a session store and HTTPS.

**401 vs 403?**
401: you are not signed in. 403: the request was understood but blocked (for example a missing security header).

## Honest note

AI (Claude) helped build this project. Be ready to explain every file in this milestone in your own words.
