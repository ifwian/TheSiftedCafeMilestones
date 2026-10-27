# Testing report: what was tested and what was not

Be honest about this in your defense. This page says exactly what was checked, how, and what still needs checking on **your** computer.

## The environment limit

The project was built and tested in a sandbox that had **no access to the npm registry** (so the real `express`, `mysql2` and `dotenv` packages could not be installed) and **no MySQL server**. Nothing was bypassed.

To still test as much as possible, the real `server/server.js` and the real browser files were run against **stand-ins** that are *not* part of this ZIP:

- a small Express look-alike written on Node's built-in `http` module (routes, JSON body reading, static files, redirects, cookies/headers),
- a `mysql2/promise` look-alike backed by **SQLite** (`node:sqlite`), with the same table shape and rules (guests 1 to 20, the five statuses, automatic timestamps, the new `occasion` and `allergies` columns),
- a do-nothing `dotenv`.

So the *project's own code* was really executed end to end, but **not on real Express and not on real MySQL**. The stand-ins are our own code and can be more forgiving than the real thing. That is why the last section matters.

## What was tested (and passed)

### Unit tests: `npm test` (20 tests, all passed)
Validation of name, phone, **email required**, branch, **guests 2 to 10 online and 1 to 20 for staff**, date (**no same-day**, past, impossible like Feb 31, too far ahead), **hourly times inside each branch's hours** (Calamba from 10:00, Cabuyao from 9:00), occasion and allergies, other-requests length, odd input (`null`, text, arrays), the status being ignored on public requests, the staff-edit rules, and the 6-month cut-off date.

### API tests: `npm run test:api` (19 tests, all passed, against the stand-in server)
- Health check, public pages served, security headers present, `x-powered-by` hidden.
- **Cafe rules:** 1 or 11 guests, same-day, no email, half-hour time, Calamba at 9 AM or 10 PM are all refused; Cabuyao at 9 AM is accepted.
- **Capacity:** 10 + 8 guests fit, 3 more get 409, 2 more fit (exactly 20), the other branch and another time slot are unaffected.
- Create: valid saves as `pending` with an `SC-` reference; invalid data gives per-field errors; honeypot blocks bots; missing `X-Requested-With` header is blocked (403); broken JSON gives 400.
- Protection: staff routes return 401 without a session; `/admin` redirects to `/login`.
- Login: wrong password 401; correct password sets an `HttpOnly`, `SameSite=Strict` cookie.
- Read: list, summary, search, status/branch filters, unknown sort refused; SQL-injection text matched nothing and caused no error.
- Full CRUD on one reservation: read one, edit (persisted), bad edit refused, status change, bad status refused, delete (then 404), bad ids refused.
- Logout ends the session.

### Browser test with Playwright (Chromium), 39 checks, all passed
Public page: Calamba hides the 9 AM time and Cabuyao hides 9 PM, the date picker starts tomorrow, 1 guest and an empty email are refused with messages, all images load, nav links point to real sections, invalid form does not submit, valid form shows success with an `SC-` reference and Pending, a past date is refused with a message, gallery lightbox opens and closes. Login: wrong password refused, right password opens the dashboard, cookie is HttpOnly + SameSite=Strict. Protection: `/admin` redirects visitors, API returns 401. Dashboard: new reservation appears, summary cards correct, search/filter/clear work, View + status change updates the cards, edit shows a server error under the field then saves, **edit persisted after page reload**, delete asks for confirmation (Cancel keeps it), **delete persisted after reload**, logout then `/admin` is protected again. Responsive: no sideways scrolling on tablet (820 px) and phone (390 px) for the public page and the phone dashboard; the phone menu opens. No page errors and no missing files (404) during the run.

(Google Fonts could not be downloaded in the sandbox, so the browser used fallback fonts in the test screenshots. On your computer with internet the real fonts load. The browser test also deliberately triggers 400 and 401 answers, so those lines in the console are expected.)

### Other checks
- `node --check` passed for `server.js`, `app.js`, `login.js`, `admin.js`.
- With the database unavailable (simulated), `/api/health` answers 503, saving a reservation answers 503 with a friendly message, the technical error goes to the terminal, and the public website still loads.
- A bug found by the new browser test and fixed: clicking **Send** right after typing a bad value could do nothing, because the error message shifted the button before the click finished. The form now skips the on-leave message when the visitor clicks Send.
- The 6-month clean-up was tested with a small database file: an 18-month-old reservation was deleted at startup and a 2-month-old one was kept.
- Two defects found while testing were fixed: the staff-notes column was shorter (500) than the validation limit (1000), and calling the validator without the "staff" flag could skip the strict rules.

## What was NOT tested (please verify on your computer)

| Not tested | How to verify |
| --- | --- |
| The real `npm install` (and so a generated `package-lock.json`, which is not in the ZIP) | Run `npm install`. It creates `package-lock.json`; commit that file |
| The real Express and mysql2 packages | `npm start`, then use the site |
| **`database.sql` in real MySQL / MySQL Workbench** | Run it as in the README. It uses standard MySQL 8 syntax (`CHECK` needs MySQL 8.0.16 or newer) |
| Real MySQL behavior: column types, date/time strings, `ON UPDATE CURRENT_TIMESTAMP` | Do the manual checklist in the README and look at the table in Workbench |
| A real MySQL outage message | Stop the MySQL service and submit the form |
| The real fonts and the exact look in your browser | Open `http://localhost:3000` and compare with the original site |
| Other browsers (Firefox, Safari, real phones) | Try them; only Chromium was automated |
| HTTPS / production mode (`NODE_ENV=production`, `Secure` cookie) | Not applicable on localhost |
| Load or many users at once | Not tested |

Run `npm test` and `npm run test:api` on your own machine too. If everything is green there, with real MySQL, the project works as described.

## Quick re-test list (10 minutes)

1. `npm install`, run `database.sql`, create `.env`, `npm start`.
2. `npm test` (should show 20 passing).
3. In a second terminal `npm run test:api` (should show 19 passing).
4. Do the manual checklist in the README.
