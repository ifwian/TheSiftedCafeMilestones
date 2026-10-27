# 01. Project Plan

**Project:** The Sifted Cafe & Bakery: reservation website and staff dashboard
**Course project by:** (write your group members' names here)
**Technologies:** HTML5, CSS3, vanilla JavaScript, Node.js, Express.js, MySQL (MySQL Workbench)

## 1. The problem

The cafe (Calamba and Cabuyao branches) has a nice public presence, but customers who want a table have to message or call. Staff have no single place to see requests, so requests get lost or double-handled.

## 2. The goal

A website where:
1. a customer can read about the cafe and **send a table reservation request** in under a minute, and
2. staff can **sign in and manage every request** (see it, confirm it, change it, cancel it, delete it).

All requests are stored in a real database so nothing is lost when the server restarts.

## 3. Who will use it

| User | Wants | Pages |
| --- | --- | --- |
| Customer | See the menu and photos, find the branches, reserve a table | `index.html` |
| Staff | See new requests, confirm or cancel, fix mistakes, keep notes | `login.html`, `admin.html` |

## 4. Scope

**In scope (must have)**
- Public website: hero, About, Featured menu, Gallery, Visit us, footer. Works on phone, tablet and desktop.
- Reservation form with checks in the browser **and** on the server. New requests are saved as *Pending*.
- Staff login (separate page) with protected staff pages.
- Dashboard: counts, search, filters, view details.
- Full CRUD on reservations: Create, Read, Update (including status), Delete with confirmation.
- Documentation, tests, and a defense reviewer.

**Out of scope (we say this honestly in the defense)**
- Online payment, email/SMS sending, a seating plan with individual tables (we only count guests per time slot), several staff accounts with roles, hosting on the internet.

## 4b. Cafe rules we must follow (from the manager interview, see `08_interview_results.md`)

- Hours: Calamba 10:00 AM to 10:00 PM, Cabuyao 9:00 AM to 9:00 PM. Reservation times **every hour**.
- At least **1 day notice** (no same-day). Online groups of **2 to 10** guests. Capacity **20 guests per time slot** at each branch.
- **Staff confirm** every request. Hold the table **15 minutes** for a late customer.
- Ask for: name, phone, date, time, guests, **email (required)**, **occasion**, **allergies or special needs**.
- Delete old records after **6 months**.
- Not answered (we assume a value until the owner answers): last time before closing, how far ahead, reply time, cancellation deadline, phone/email on the website.

## 5. Feature list and priority

| # | Feature | Priority |
| --- | --- | --- |
| 1 | Public pages in the existing brand style | Must |
| 2 | Reservation form + validation | Must |
| 3 | Save reservations in MySQL as Pending | Must |
| 4 | Staff login and logout, protected routes | Must |
| 5 | Dashboard list, search, filters, counts | Must |
| 6 | Edit, change status, delete with confirmation | Must |
| 7 | Responsive layout, accessibility basics | Should |
| 8 | Automatic tests, documentation | Should |
| 9 | Spam protection (honeypot, rate limit) | Could |
| 10 | Capacity check: 20 guests per time slot per branch | Must (from the interview) |
| 11 | Delete reservations older than 6 months | Must (from the interview) |

## 6. Technology choices and why

| Choice | Reason |
| --- | --- |
| Plain HTML/CSS/JS | Required by the course; no framework to hide how things work |
| Node.js + Express | One language for browser and server; small and easy to explain |
| MySQL | Required; a real relational database with types and rules |
| mysql2 | Lets Node send SQL with `?` placeholders (safe from SQL injection) |
| dotenv | Keeps passwords out of the code (`.env`) |

## 7. Milestone roadmap (what we show our professor, in order)

| Milestone | What we build | What we can demonstrate |
| --- | --- | --- |
| **1. Planning** (this folder) | Plan, wireframes, database design, API plan, test plan | The documents and wireframes |
| **2. HTML and CSS** | The public page, structure and style only | The finished-looking page, responsive; no behavior yet |
| **3. JavaScript** | Menu, gallery viewer, form checks, form sending (against a fake in-browser server) | The form working and showing messages |
| **4. Staff screens and polish** | Login page, dashboard, dialogs (still fake data), accessibility and phone layout | The whole interface clickable |
| **5. Server and database** | Express, MySQL, `database.sql`, saving real reservations | A reservation appearing in MySQL Workbench |
| **6. Login and dashboard (read)** | Real login, sessions, protected routes, real list/search/view | Staff seeing real data; visitors blocked |
| **7. Full CRUD** | Edit, status changes, delete with confirmation | Every change persisting after refresh |
| **8. Testing and documentation** | Automatic tests, guides, defense reviewer | Tests passing, final handover |

## 8. Risks and how we handle them

| Risk | Plan |
| --- | --- |
| Someone breaks the form with bad input | Validate in the browser (friendly) and on the server (trusted) |
| SQL injection | Only `?` placeholders in SQL |
| Staff pages visible to everyone | Server checks the session on every staff route |
| Passwords leak to GitHub | `.env` is in `.gitignore`; only `.env.example` is shared |
| Group members can't run each other's code | One README with exact Windows steps; same Node and MySQL versions |
| We can't explain our own code | Beginner-style code, comments, and the defense reviewer |

## 9. Team (fill in)

| Name | Main job | Milestones |
| --- | --- | --- |
|  | HTML/CSS |  |
|  | JavaScript |  |
|  | Backend / database |  |
|  | Testing / documentation |  |

## 10. Definition of done

A milestone is done when: it runs on a clean computer following its README, the demo steps in its `MILESTONE.md` work, and every group member can explain what was added.
