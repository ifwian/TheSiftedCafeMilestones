# Defense Reviewer: questions your professor may ask

Answer in your own words. Each answer is short on purpose. Open the file named in **Show** if you are asked to demonstrate. Be honest that AI helped build and simplify the project, and be ready to explain every part you present.

---

## A. The big picture

**1. What does your project do?**
It is a cafe website where customers send table reservation requests. The requests are saved in MySQL as *Pending*. Staff sign in to a dashboard to view, search, edit, confirm, cancel or delete them.

**2. Why did you choose Express and MySQL?**
Express is a small, popular way to build a server in JavaScript, so we use one language on both sides. MySQL is a real database, so data stays after the server stops, and it is required by the course.

**3. What is the difference between frontend and backend here?**
Frontend = `public/` (HTML, CSS, JS in the browser). Backend = `server/server.js` (Node + Express), which checks data, talks to MySQL and protects the staff area.

**4. Why can't the browser connect to MySQL directly?**
It would need the database password in public code, and anyone could read or change the data. The server is the only one with the password and it decides what is allowed.

**5. Explain the folder structure.**
`public/` is what the browser gets, `server/` the backend, `database.sql` creates the database, `.env` holds secrets, `tests/` the automatic tests, `docs/` the guides.

## B. The form and validation

**6. What happens when someone presses "Send reservation request"?**
`app.js` checks the fields, then sends them as JSON with `fetch` to `POST /api/reservations`. The server validates again, runs a parameterized `INSERT` with status `'pending'`, and answers with a reference like `SC-00012`. The page shows a success message.

**7. Frontend vs server validation: why both?**
Frontend gives instant, friendly messages. But a user can bypass it (dev tools, Postman), so the server must check everything again. Server validation is the one we trust.

**8. Show a request that skips the browser checks.**
Use `npm run test:api`: it sends bad data straight to the server and the server answers `400` with field errors. Or open the browser console and `fetch` with a past date.

**9. Why is the status always "pending" and set on the server?**
So a customer can't send `status: confirmed` and cheat. The INSERT writes the word `'pending'` itself, and the validation ignores any status from the public form.

**10. What is the hidden "website" field?**
A honeypot. Real people never see it, bots fill every field. If it has text, the server refuses the request.

**11. Why are the opening hours and time slots hardcoded?**
The hours rarely change and the cafe told us exactly what they are (Calamba 10 AM to 10 PM, Cabuyao 9 AM to 9 PM, bookings every hour), so a small table in the code is enough and easy to explain. It is in `server.js` and `app.js`. If the cafe often changed hours, we would move it to a database table.

**12. Do you check if a table is available?**
Yes, in a simple way. The manager told us each branch can seat 20 guests at the same time slot. Before saving, the server adds up the guests already booked (pending and confirmed) for that branch, date and time. If the new request would pass 20, it answers 409 "only N seats left". It is not a seating plan, and two requests at the very same moment could both pass; a database transaction would fix that.

## C. SQL and CRUD

**12b. Where did your rules come from?**
From an interview with the Calamba branch manager (`docs/CAFE_RULES.md`): hourly times, 2 to 10 guests online, at least 1 day notice, 20 guests per slot, email required, occasion and allergy fields, 6-month record keeping. Where she left an answer blank, we made an assumption and wrote it down as an assumption.

**12c. Why is the email required?**
The cafe confirms requests manually and wants to reach the customer; the manager asked for the email to be required.

**12d. Why do you delete reservations after 6 months?**
It is a privacy rule from the cafe: names and phone numbers should not be kept forever. The server deletes reservations whose date is older than 6 months, using a `DELETE ... WHERE reservation_date < ?` with the cut-off date as a parameter.

**13. What is CRUD? Where is each part?**
Create = public form (`INSERT`). Read = dashboard list and View (`SELECT`). Update = Edit and status buttons (`UPDATE`). Delete = Delete button (`DELETE`). See the table in `PROJECT_GUIDE.md`, section 7.

**14. What is SQL injection and how do you prevent it?**
An attacker types SQL into a field, like `' OR '1'='1`, hoping it becomes part of the query. We use placeholders: `WHERE id = ?` with the values passed separately. MySQL treats them only as data. Our API test sends exactly that text and gets zero rows back.

**15. Why is the sort order not a `?` placeholder?**
Placeholders can only be values, not column names or keywords. So the server picks the `ORDER BY` text from a fixed list (`newest`, `upcoming`, `latest_date`) and refuses anything else.

**16. What is a connection pool?**
A few database connections kept open and reused, instead of opening a new one for each request. `mysql.createPool` does it.

**17. What does `async/await` do?**
Database calls take time. `await` pauses that function until the answer arrives, without blocking the whole server. It is simpler to read than callbacks.

**18. Why is `dateStrings: true` used?**
So MySQL dates arrive as simple text like `2026-10-30` and not as JavaScript Date objects, which can shift by time zone.

**19. What does `ENUM` do for `status`?**
MySQL only accepts the five allowed words. The `CHECK` on guests (1 to 20, the capacity of a slot) works the same way: the database protects itself even if our code had a bug.

**20. How do you know the changes are really saved?**
We refresh the page and look at Workbench with `SELECT * FROM reservations`. The API test also reads the row back after update and after delete.

## D. Login and security

**21. How does the login work?**
`login.js` sends username and password to `POST /api/login`. The server compares them with the values in `.env`. If correct, it creates a random token, remembers it in memory for 8 hours, and sets it as an `HttpOnly` cookie. The browser sends it back automatically and the server checks it for every staff request.

**22. Why are the credentials in `.env` and not in `login.js`?**
Everything in `public/` can be read by any visitor. `.env` stays on the server and is excluded from Git.

**23. How are staff pages protected?**
A guard `app.use('/api/admin', ...)` returns `401` if there is no valid session. `/admin` redirects to `/login`. Hiding a button is not security; this server check is.

**24. What is a cookie with `HttpOnly` and `SameSite=Strict`?**
`HttpOnly`: JavaScript can't read it, so injected script can't steal it. `SameSite=Strict`: the browser doesn't send it on requests started from other websites, which blocks most CSRF attacks.

**25. What is CSRF and XSS?**
CSRF: another website makes your browser send a request while you're signed in. XSS: an attacker's text runs as code on our page. We defend with SameSite cookie + the `X-Requested-With` header (CSRF), and `textContent` + CSP header (XSS).

**26. Is this login secure enough for a real cafe?**
No, and we say so. It is one shared account from `.env`, sessions are lost on restart, no HTTPS locally, simple rate limits. A real system needs a users table with hashed passwords (bcrypt), a session store, HTTPS, and per-user roles. For a school demo, it shows the right ideas.

**27. Why not store passwords in the database?**
This version has only one demo account, kept in `.env`. A real system would store a *hash* (never the plain password) per user.

**28. What does `timingSafeEqual` do?**
Compares two values in constant time, so an attacker cannot guess a password letter by letter by measuring how fast the answer comes.

## E. Running and testing

**29. How do you run the project?**
`npm install`, run `database.sql` in Workbench, copy `.env.example` to `.env` and fill it, `npm start`, open `http://localhost:3000`.

**30. What is `package.json`? What is `node_modules`?**
`package.json` lists the dependencies (express, mysql2, dotenv) and commands. `npm install` downloads them into `node_modules`. We never upload `node_modules`; anyone can recreate it.

**31. Why is `.env` in `.gitignore`?**
It has passwords. If it reached GitHub, anyone could read them.

**32. What did you test?**
See `docs/TESTING.md`. Be precise: the unit and API tests and the browser test ran against stand-ins for Express and MySQL (the build environment had no internet package access or MySQL). Your own full run with real MySQL is the final check.

**33. What happens if MySQL is down?**
The server keeps running. Routes that need the database answer `503` with a friendly message, and the terminal shows the technical error and hints.

## F. "What would you improve?"

- Lock the capacity check in a database transaction, and show free seats on the form.
- A users table with hashed passwords and roles.
- Store sessions in MySQL, use HTTPS in production.
- Send confirmation emails or SMS.
- Pagination for hundreds of reservations.
- Different hours per branch from the database.

## G. Quick drill: say it in one sentence

- **Route**: an address + method that runs a function (`app.get('/x', ...)`).
- **Middleware**: a function that runs before the route (security headers, the login guard, the JSON reader).
- **JSON**: text format to send objects between browser and server.
- **`fetch`**: the browser's way to call the server without reloading the page.
- **Status codes**: 200 OK, 201 created, 400 bad data, 401 not signed in, 403 blocked, 404 not found, 429 too many, 503 database unavailable.
- **Session**: the server's memory of "this browser is signed in".
