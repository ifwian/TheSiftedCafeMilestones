# The Sifted Cafe & Bakery: Reservation Website

A school project: the public website of a cafe with a **table reservation form**, and a **staff dashboard** where reservations are viewed, edited, confirmed, cancelled and deleted. Everything is saved in a **MySQL** database.

Built with HTML, CSS and plain JavaScript in the browser, and Node.js + Express + MySQL on the server. No frameworks (no React, Bootstrap, Tailwind...).

> **About this version.** AI (Claude) helped rebuild this project into a simpler form. The code is written to be read and explained by second-year students, but **you must read it and understand it before your defense**. The `docs/` folder will help.

---

## What you can do

| Who | What |
| --- | --- |
| Customer | Browse the site (hero, menu, gallery, About, Visit us), send a reservation request (2 to 10 guests, at least 1 day ahead, hourly times). It is saved as **Pending**. |
| Staff | Sign in at `/login`, then see the dashboard: counts, search, filters, **View**, **Edit**, change **status**, **Delete** (with confirmation). |

Statuses: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`.

---

## Folder structure

```
TheSiftedCafe/
├── public/                 what the browser receives
│   ├── index.html          the public website + reservation form
│   ├── login.html          staff sign-in page
│   ├── admin.html          staff dashboard (only served to signed-in staff)
│   ├── css/style.css       ALL the styling (shared, website, staff)
│   ├── js/app.js           public page: menu button, gallery, form + browser validation
│   ├── js/login.js         login page script
│   ├── js/admin.js         dashboard: list, filters, view, edit, status, delete
│   └── assets/             logo and photos
├── server/server.js        the whole backend: validation, MySQL, login, API routes
├── tests/                  automatic tests (validation.test.js, api.test.js)
├── docs/                   PROJECT_GUIDE.md, CAFE_RULES.md, DEFENSE_REVIEWER.md, TESTING.md
├── database.sql            creates sifted_cafe_db and the reservations table
├── database_update.sql     only if you made the table with an OLDER database.sql
├── .env.example            copy to .env and fill in
├── .gitignore              keeps .env and node_modules out of Git
├── package.json            dependencies and the npm commands
└── README.md               this file
```

Why only one server file? So you can read the whole backend top to bottom. It has numbered sections and comments.

---

## Setup on Windows (VS Code)

### 0. Install these once
- **Node.js** (LTS version 18 or newer) from nodejs.org. Check: open a terminal and type `node -v`.
- **MySQL Server** and **MySQL Workbench** (MySQL Installer for Windows installs both). Remember the **root password** you choose.
- **VS Code**.

### 1. Open the project
1. Extract `TheSiftedCafe.zip` (right-click, *Extract All*).
2. In VS Code: *File, Open Folder*, choose the extracted `TheSiftedCafe` folder.
3. Open a terminal inside VS Code: *Terminal, New Terminal*.

### 2. Install the dependencies
```
npm install
```
This reads `package.json` and downloads **express**, **mysql2** and **dotenv** into a `node_modules` folder. (It also creates `package-lock.json`.)

### 3. Create the database with MySQL Workbench
1. Open **MySQL Workbench** and click your local connection (usually `Local instance MySQL80`). Enter your root password.
2. *File, Open SQL Script...* and choose `database.sql` from the project folder.
3. Click the **lightning bolt** button (Execute). The bottom panel should show green checks and a result `total_reservations = 0`.
4. In the left *Schemas* panel, click the refresh icon. You should see `sifted_cafe_db`, then *Tables*, then `reservations`.

You can run the script again any time. It never deletes your data.

> **Already created the table with an older `database.sql`?** Run `database_update.sql` once in Workbench. It adds the two new columns (`occasion`, `allergies`) and keeps your reservations.

### 4. Create your `.env` file
1. In VS Code, copy `.env.example` and name the copy **`.env`** (exactly, with the dot).
2. Fill it in:
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your real MySQL password
DB_NAME=sifted_cafe_db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=a password you choose
NODE_ENV=
```
`.env` is secret. It is in `.gitignore`, so Git will not upload it. **Never share it or put it in a ZIP.**

### 5. Start the server
```
npm start
```
You should see:
```
The Sifted Cafe is running:
  Website: http://localhost:3000/
  Staff:   http://localhost:3000/login
  Database: connected
```
Open **http://localhost:3000** in your browser. Staff sign-in: **http://localhost:3000/login**. Stop the server with `Ctrl + C`.

While editing code you can use `npm run dev`, which restarts the server when files change.

---

## Running the automatic tests

```
npm test                 # unit tests for the validation (no database needed)
```
For the API tests, start the server in one terminal (`npm start`), then in a second terminal:
```
npm run test:api
```
**The server must already be running** (otherwise every test fails with `fetch failed`). The API tests read `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`. They create reservations named "Zz Test ..." and delete them at the end.

---

## Manual testing checklist

Tick each one yourself on your own computer.

**Public site**
- [ ] The page loads with the logo, photos and fonts. Menu links (About, Menu, Gallery, Visit us) scroll to the right sections.
- [ ] On a narrow window (or phone), the menu button opens and closes the navigation.
- [ ] Gallery photo opens a larger view. Esc closes it. Arrow buttons move between photos.
- [ ] Submit the form empty: you see messages and nothing is saved.
- [ ] Type a bad phone number (letters), today's date, 1 guest, 11 guests, no email: each shows a clear message.
- [ ] Choose **Calamba**: the Time list starts at 10:00 AM. Choose **Cabuyao**: it starts at 9:00 AM. The date picker starts tomorrow.
- [ ] Book 10 + 8 guests for the same branch, date and time, then try 3 more: you get "only 2 seats left" (capacity is 20 guests per time slot per branch).
- [ ] Submit a correct form: you see a success message with a reference like `SC-00001` and the status **Pending**.
- [ ] In MySQL Workbench run `SELECT * FROM sifted_cafe_db.reservations;`: the new row is there with `status = pending`.

**Login and protection**
- [ ] Open `http://localhost:3000/admin` without signing in: you are sent to `/login`.
- [ ] Wrong password: error message, no entry.
- [ ] Correct password: the dashboard opens and shows your username.
- [ ] Open `http://localhost:3000/api/admin/reservations` in a new private window: it says "Please sign in" (401).
- [ ] **Sign out**, then press the browser Back button and refresh: you cannot see the data.

**Dashboard / CRUD**
- [ ] The new reservation appears in the table. The count cards match.
- [ ] Search by name, phone or `SC-00001` works. Status, branch and date filters work. *Clear filters* resets.
- [ ] **View** shows all details. Change the status to *Confirmed*: the badge and the cards update.
- [ ] **Edit**: save a valid change (for example guests 4 to 6). Try an invalid value: the message shows under that field.
- [ ] Refresh the page: your changes are still there (they are in MySQL, not only in the browser).
- [ ] **Delete**: Cancel keeps the row. Confirm removes it. Check in Workbench that the row is gone.
- [ ] Stop MySQL (Windows Services), submit the form: you get a friendly "temporarily unavailable" message, not a crash.

---

## Common errors and fixes

| What you see | Why | Fix |
| --- | --- | --- |
| `'node' is not recognized` | Node.js is not installed or the terminal was opened before installing | Install Node.js, close and reopen VS Code |
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` in the project folder |
| `Database: ... ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` or `DB_PASSWORD` in `.env` | Use the same login as in MySQL Workbench |
| `ER_BAD_DB_ERROR: Unknown database` or `ER_NO_SUCH_TABLE` | `database.sql` was not run | Run it in Workbench (step 3) |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL server is not running | Windows: *Services*, start `MySQL80` |
| `EADDRINUSE: address already in use :::3000` | Another program (or an old server) uses port 3000 | Close the old terminal, or set `PORT=3001` in `.env` |
| You cannot sign in with the right password | `.env` missing, misspelled, or the server was not restarted after editing it | Check `.env`, then stop and `npm start` again |
| After restarting the server you are signed out | Sessions are kept in memory | Sign in again (expected, see limitations) |
| Page looks unstyled | You opened `index.html` by double clicking | Always use `http://localhost:3000` |
| "Request blocked: missing security header" | A request was sent without `X-Requested-With: fetch` (for example from a tool like Postman) | Add the header, or use the website forms |

---

## Security: what is protected and what is NOT (honest summary)

This is a **school project**. It has sensible basics, but it is not ready for the real internet.

Protected:
- Passwords and database login are in `.env` on the server and never sent to the browser.
- Every SQL query uses `?` placeholders (**no SQL injection**).
- The server validates every field again (browser checks can be skipped by anyone).
- All `/api/admin/...` routes and the `/admin` page need a valid session.
- The session cookie is `HttpOnly` (JavaScript cannot read it) and `SameSite=Strict`. Every change request also needs an `X-Requested-With: fetch` header (basic CSRF protection).
- Customer text is shown with `textContent`, so it can never run as HTML or script (**no XSS**). Security headers (CSP and others) are set.
- Small limits: 10 saved reservations and 10 failed logins per address per 15 minutes. A hidden "honeypot" field catches simple bots.
- Privacy: reservations older than 6 months are deleted automatically (the cafe's rule).

Limitations:
1. **One shared demo account** from `.env` (no user table, no password hashing, no roles). Fine for a demo, not for a real team.
2. **Sessions are in memory.** Restarting the server signs everybody out. They would not work across several server copies.
3. **No HTTPS on localhost.** A real site must use HTTPS and set `NODE_ENV=production` (which adds the `Secure` cookie flag).
4. **Rate limits are simple** and also in memory (and reset on restart).
5. **Capacity is checked, but simply.** Each branch seats 20 guests per time slot, counting pending and confirmed requests. Two requests sent at the exact same moment could both pass (a real system would use a database transaction). Staff edits are not checked on purpose.
6. No email or SMS is sent. Staff contact the customer by phone or email.
7. **Cafe rules come from the manager interview** (`docs/CAFE_RULES.md`): hourly times inside each branch's hours, 2 to 10 guests online, at least 1 day notice, 20 guests per slot, email required, 6-month record clean-up. A few answers were left blank, so we assumed: last request 1 hour before closing, and up to 60 days ahead. These are assumptions until the owner answers. Change them at the top of `server/server.js` and in `public/js/app.js`.
8. Still not given by the owner, so the site does not show them: the phone number and email, the Cabuyao street address, and the real menu and prices (the six menu items are samples with no prices). The Calamba address and both branches' hours are confirmed.

---

## Where to read more

- `docs/PROJECT_GUIDE.md`: how everything works, with code snippets.
- `docs/CAFE_RULES.md`: the manager's interview answers and where each one is used in the project.
- `docs/DEFENSE_REVIEWER.md`: questions your professor may ask, with easy answers.
- `docs/TESTING.md`: exactly what was tested, how, and what still needs checking on your computer.
- `database.sql`: the database script.
