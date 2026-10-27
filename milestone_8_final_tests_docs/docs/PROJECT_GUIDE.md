# Project Guide: how The Sifted Cafe works

Read this after the README. It explains the project in the order a visitor uses it. Open the real files next to it. The code uses plain `function`, `var` and simple `if` / `for` on purpose.

## 1. What the project does

A cafe website with two sides:

1. **Public side** (`index.html`): customers read about the cafe and send a reservation request.
2. **Staff side** (`login.html`, `admin.html`): staff sign in and manage the requests.

All reservations live in **MySQL**. The browser never talks to MySQL. It talks to **Express** (our server), and Express talks to MySQL.

```
Browser (HTML/CSS/JS)  --fetch (JSON)-->  Express (server/server.js)  --SQL-->  MySQL
        <----------------- JSON ---------------      <------- rows --------
```

## 2. Technologies and why

| Technology | Why we use it |
| --- | --- |
| HTML5 | The structure of the pages |
| CSS3 | The look (one file, `style.css`, with colors as CSS variables) |
| Vanilla JavaScript | The behavior in the browser, no framework to learn |
| Node.js | Lets us run JavaScript on the server |
| Express | Small library: "when a request arrives at this address, run this function" (routes) |
| MySQL | A real database, so data survives restarts |
| mysql2 | The library that lets Node send SQL to MySQL (with `?` placeholders) |
| dotenv | Reads the secret settings from the `.env` file |

## 3. The files

| File | What it does |
| --- | --- |
| `server/server.js` | The whole backend. Sections: 1 settings, 2 database, 3 helpers, 4 validation, 5 security headers, 6 create reservation, 7 login/session, 8 staff API, 9 pages and error handler, start |
| `public/index.html` | Public page and the reservation form |
| `public/js/app.js` | Mobile menu, gallery lightbox, form checking and sending |
| `public/login.html`, `js/login.js` | Sign-in form and script |
| `public/admin.html`, `js/admin.js` | Dashboard page and script (list, filters, dialogs) |
| `public/css/style.css` | All styles |
| `database.sql` | Creates the database and the table |
| `.env` (you create it) | Passwords and settings. Secret. |
| `tests/` | Automatic tests |

## 4. The database

One table, `reservations`:

| Column | Meaning |
| --- | --- |
| `id` | Automatic number (1, 2, 3...). The reference `SC-00012` is just `id` 12 written with 5 digits |
| `customer_name`, `phone`, `email` | Contact details. Email is **required** for customers (we confirm by email) |
| `branch` | `calamba` or `cabuyao` |
| `reservation_date`, `reservation_time` | `DATE` and `TIME` columns |
| `guests` | Online: 2 to 10. Staff edits: 1 to 20. A `CHECK` rule (1 to 20) protects the table even if the code had a bug |
| `occasion`, `allergies` | Optional: birthday or meeting, and allergies or special needs |
| `special_requests` | Optional text |
| `status` | `ENUM`: pending, confirmed, cancelled, completed, no_show. Default `pending` |
| `admin_notes` | Private notes for staff |
| `created_at`, `updated_at` | Filled in by MySQL automatically |

## 5. How the reservation form works (Create)

1. The customer fills in the form in `index.html`.
2. `app.js` checks the fields first (**frontend validation**): required, number ranges, date not in the past. This gives fast, friendly messages.
3. If it is fine, `app.js` sends the data with `fetch`:
```js
var response = await fetch('/api/reservations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
  body: JSON.stringify(data)
});
```
4. Express receives it in `app.post('/api/reservations', ...)` in `server.js` and runs `checkReservation(...)` (**server validation**).
5. If a field is wrong, the server answers `400` with a message for each field. `app.js` shows them under the fields.
6. If all is fine, the server saves it with a parameterized INSERT. The status is always `'pending'`:
```js
var saved = await runSql(
  "INSERT INTO reservations (customer_name, phone, email, branch, reservation_date, reservation_time, guests, special_requests, status) " +
  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
  [v.customer_name, v.phone, v.email, v.branch, v.reservation_date, v.reservation_time, v.guests, v.special_requests]
);
```
7. The server answers `201` with the reference. `app.js` shows the success message: "Your request has been received. It is NOT confirmed yet."
8. If MySQL is down, the error handler answers `503` with a friendly message (and prints the technical error in the terminal).

### Frontend validation vs server validation

| | Frontend (`app.js`) | Server (`checkReservation`) |
| --- | --- | --- |
| Purpose | Be friendly and fast | Be **safe** |
| Can the user skip it? | **Yes** (dev tools, Postman, disabling JS) | **No** |
| Do we trust it? | No | Yes |

The rule: *frontend validation is for the user, server validation is for the system.* We do both.

## 6. How Express talks to MySQL

At the top of `server.js` we create a **pool** (a few ready connections that are reused):
```js
var pool = mysql.createPool({ host: process.env.DB_HOST || 'localhost', ... });

async function runSql(sql, values) {
  var result = await pool.execute(sql, values || []);
  return result[0];
}
```
Every route calls `runSql('...?...', [values])`. The `?` marks are filled by the driver. The values are sent **separately** from the SQL, so text typed by a visitor can never become SQL code. That is how we prevent **SQL injection**.

`async` / `await` means "wait for the database, then continue". `try { ... } catch (error) { next(error); }` sends any error to the one error handler at the bottom.

## 7. CRUD: what each button does

| Action | Browser (`admin.js`) | Route in `server.js` | SQL |
| --- | --- | --- | --- |
| **C**reate | public form | `POST /api/reservations` | `INSERT INTO reservations ...` |
| **R**ead list | `loadList()` | `GET /api/admin/reservations?status=&search=...` | `SELECT ... WHERE ... ORDER BY ... LIMIT 500` |
| **R**ead one | **View** | `GET /api/admin/reservations/:id` | `SELECT ... WHERE id = ?` |
| **U**pdate (edit) | **Edit** | `PUT /api/admin/reservations/:id` | `UPDATE reservations SET ... WHERE id = ?` |
| Status | status buttons | `PATCH /api/admin/reservations/:id/status` | `UPDATE reservations SET status = ? WHERE id = ?` |
| **D**elete | **Delete** + confirm | `DELETE /api/admin/reservations/:id` | `DELETE FROM reservations WHERE id = ?` |
| Counts | cards at the top | `GET /api/admin/summary` | `SELECT status, COUNT(*) ... GROUP BY status` |

Because every change goes to MySQL, refreshing the page shows the same data. Nothing is kept only in a JavaScript array.

### How search and filters work

`buildQuery()` in `admin.js` collects the filter boxes into an address like `?search=ana&status=pending&sort=newest`. The server builds the `WHERE` part from only the filters that were sent, always with `?` placeholders. The `ORDER BY` text can **not** be a placeholder, so it comes from a fixed list in the server (`newest`, `upcoming`, `latest_date`). Anything else is refused. Typing in the search box waits 300 ms after the last key before sending (so we do not send a request per letter). Each list load has a number so a slow old answer cannot replace a newer one.

## 8. Login and sessions

1. `login.js` sends `POST /api/login` with the username and password.
2. The server compares them with `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`. The comparison uses `crypto.timingSafeEqual` on hashes, so the time it takes does not reveal how many letters were right. The error message is the same for a wrong username or password.
3. If correct, the server makes a random token (`crypto.randomBytes(32)`), stores it in an object `sessions[token] = { username, expires }` (8 hours), and sends it in a cookie:
   `sifted_admin=<token>; HttpOnly; SameSite=Strict; Path=/`
4. The browser sends that cookie automatically with every request.
5. This guard runs before every staff route:
```js
app.use('/api/admin', function (req, res, next) {
  if (getSession(req) === null) {
    return res.status(401).json({ error: 'Please sign in.' });
  }
  next();
});
```
6. `GET /admin` sends the dashboard page only to signed-in staff; others are redirected to `/login`.
7. **Sign out** deletes the session from the server and clears the cookie.

Why the credentials are not in the JavaScript: anything in `public/` can be read by anyone with "View source". The secret stays on the server in `.env`.

Limitations are listed in the README (shared demo account, memory sessions, no HTTPS locally).

## 9. Safety extras (short list)

- **XSS**: user text is put on the page with `textContent` (never `innerHTML`).
- **CSRF**: `SameSite=Strict` cookie + required `X-Requested-With: fetch` header on every change.
- **Headers**: Content-Security-Policy, X-Frame-Options, nosniff, Referrer-Policy; `x-powered-by` off.
- **Bots/spam**: hidden `website` field (must stay empty), 10 reservations / 15 min per address, 10 failed logins / 15 min per address.
- **Server rules** (from the manager interview, see `CAFE_RULES.md`): name letters only, phone digits, email required, 2 to 10 guests online, real dates, **at least 1 day notice** (no same-day, Manila time), up to 60 days ahead, **hourly times inside each branch's opening hours** (Calamba 10 AM to 10 PM, Cabuyao 9 AM to 9 PM; last request 1 hour before closing).
- **Capacity**: each branch seats **20 guests per time slot**. See section 12.
- **Privacy**: reservations older than 6 months are deleted automatically. See section 12.

## 10. Running and testing

See the README. Short version: `npm install`, run `database.sql` in Workbench, create `.env`, `npm start`, open `http://localhost:3000`. Tests: `npm test`, and `npm run test:api` with the server running. Read `docs/TESTING.md` for exactly what has been verified.

## 11. How to make common changes

| I want to... | Change this |
| --- | --- |
| Change opening hours or time slots | `BRANCH_HOURS` in `server/server.js` **and** in `public/js/app.js`; the hourly `<option>`s of `#res-time` in `index.html` |
| Change the online group size | `MIN_GUESTS` / `MAX_GUESTS` in `server.js`, `min` / `max` on `#res-guests` in `index.html`, and the numbers in `checkValues` in `app.js` |
| Change the seats per time slot | `SLOT_CAPACITY` in `server.js` |
| Change how long records are kept | `RETENTION_MONTHS` in `server.js` (or `RETENTION_MONTHS` in `.env`; `0` keeps everything) |
| Add a status | `ENUM` in `database.sql` (and `ALTER TABLE` on an existing DB), `STATUSES` in `server.js`, `STATUS_LABELS` in `admin.js`, a `.badge-...` style in `style.css` |
| Change colors | CSS variables at the top of `style.css` |
| Change the session length | `SESSION_HOURS` in `server.js` |

## 12. Capacity and the 6-month clean-up (rules from the interview)

**Capacity.** The manager said each branch can take **20 guests at the same time slot**. Before saving, the create route asks MySQL how many guests are already booked:
```js
async function guestsAlreadyBooked(branch, date, time) {
  var rows = await runSql(
    "SELECT COALESCE(SUM(guests), 0) AS total FROM reservations " +
    "WHERE branch = ? AND reservation_date = ? AND reservation_time = ? AND status IN ('pending', 'confirmed')",
    [branch, date, time]
  );
  return Number(rows[0].total);
}
```
Then `if (taken + v.guests > SLOT_CAPACITY)` the server answers **409** with "only N seats left" and the page shows it under the Time field. Pending and confirmed requests both count (so we never promise the same seats twice). Cancelled, completed and no-show do not.

Limits you should mention: two requests at the very same moment could both pass (a real system would lock the rows in a transaction), and staff edits are not capacity-checked on purpose.

**6-month clean-up.** The cafe said records may be deleted after 6 months. `deleteOldReservations()` works out the cut-off date in JavaScript and sends it as a `?` value:
```js
var cutoff = monthsBefore(getCafeNow().date, RETENTION_MONTHS);
await runSql('DELETE FROM reservations WHERE reservation_date < ?', [cutoff]);
```
It runs when the server starts and then once a day. Records are counted by the **reservation date**.

**Per-branch times in the form.** `app.js` keeps the same `BRANCH_HOURS` table and hides the times that do not fit the chosen branch. The server checks again (`SLOTS[branch]`), because the browser can be bypassed.

