# The Sifted Cafe: Milestones (step-by-step progress)

Eight folders, one per milestone. Each one **runs on its own** and shows a bit more than the one before, so you can present real progress to your professor instead of one finished project. Milestone 8 is the finished project.

Every folder has a `README.md` with: what is new, **demo steps**, **what is NOT done yet**, talking points, and likely questions.

## The path

| # | Milestone | You show | How it runs |
| --- | --- | --- | --- |
| 1 | **Planning** | Plan, wireframes, database design, API plan, test plan | Open the documents. `02_wireframes.html` in a browser |
| 2 | **HTML and CSS** | The finished-looking public page, responsive. No behavior | Double-click `index.html` |
| 3 | **JavaScript** | Menu, photo viewer, form checks, form "sending" | Double-click `index.html` (fake server inside the browser) |
| 4 | **Staff screens and polish** | Login page, dashboard, edit/delete windows, phone layout | Double-click `index.html` (demo data, login `admin` / `demo123`) |
| 5 | **Server and database** | A reservation really saved in MySQL | `npm install`, run `database.sql`, `.env`, `npm start` |
| 6 | **Login and dashboard (read)** | Real login and sessions, real list/search/view, visitors blocked | same as 5 |
| 7 | **Full CRUD** | Edit, status change, delete, all persisting in MySQL | same as 5 |
| 8 | **Testing and documentation** | `npm test`, API tests, guides, defense reviewer | same as 5 |

Size of each step (lines of HTML, CSS, JavaScript and SQL, comments included):

| # | Folder | Lines of HTML/CSS/JS/SQL |
| --- | --- | --- |
| 1 | `milestone_1_planning` | 119 |
| 2 | `milestone_2_html_css` | 1006 |
| 3 | `milestone_3_javascript` | 1722 |
| 4 | `milestone_4_staff_screens_polish` | 3104 |
| 5 | `milestone_5_server_mysql` | 2304 |
| 6 | `milestone_6_login_dashboard_read` | 3491 |
| 7 | `milestone_7_full_crud` | 3889 |
| 8 | `milestone_8_final_tests_docs` | 4136 |

## Which milestones need what

- **Milestones 1 to 4** need only a browser. No Node.js, no MySQL, no internet (fonts fall back if offline).
- **Milestones 5 to 8** need Node.js, MySQL Server and MySQL Workbench. Setup steps are in each folder's `README.md` (Windows and VS Code).

## A good presentation order (about 15 minutes)

1. **Planning (1 min).** Show the wireframes and the roadmap table.
2. **HTML and CSS (2 min).** "This is only structure and style." Resize the window. Point to the CSS variables.
3. **JavaScript (3 min).** Menu, gallery, form messages, successful send. Say clearly that a **fake server** answers for now, and why that is useful.
4. **Staff screens (2 min).** Login, dashboard, dialogs. Still demo data.
5. **Server and database (3 min).** The key moment: send the form, then show the row in MySQL Workbench.
6. **Login and read dashboard (2 min).** Private window blocked, cookie flags, real data.
7. **Full CRUD (2 min).** Edit, confirm, delete, refresh, check Workbench.
8. **Tests and docs (1 min).** `npm test`, the defense reviewer.

You do not have to present all eight at once. Show only up to the milestone you have reached for that consultation.

## How the pieces connect (why the steps fit together)

The page code always asks the same thing: `fetch("/api/reservations")`, `fetch("/api/admin/...")`.

- In Milestones 3 and 4, a small file (`demo-api.js`) **pretends to be the server** inside the browser.
- In Milestone 5 that file is deleted and the real Express server answers the same questions.

That is why the pages (`app.js`, `login.js`, `admin.js`) are nearly the same in every milestone. Milestone 6 only reduces the dashboard to read-only on purpose; Milestone 7 gives it back its edit and delete actions.

## Honest notes (say them yourself before your professor asks)

- AI (Claude) helped build and simplify this project. Read the code and be able to explain it.
- The fake server in Milestones 3 and 4 is a temporary stand-in and is clearly labeled DEMO MODE on screen.
- The demo login (`admin` / `demo123`) in Milestone 4 is **not secure**. The real login is Milestone 6.
- How it was tested: see `milestone_8_final_tests_docs/docs/TESTING.md`. The server milestones were run here against stand-ins for Express and MySQL, so please run them with the real ones on your own computer before presenting.
- Milestone 1 has no code on purpose.
- **The cafe rules come from the manager interview** (10/15/2026). See `milestone_1_planning/08_interview_results.md` and `milestone_8_final_tests_docs/docs/CAFE_RULES.md`. Some answers were left blank (last time before closing, how far ahead, reply time, cancellation deadline, phone/email, Cabuyao address). We assumed values for the rules and the site says the missing contact details will be added soon. Ask the owner to confirm them before the final defense.

## Using Git (optional but nice for "progress")

Create one commit per milestone, so your history shows the steps:

```
git add .
git commit -m "Milestone 2: HTML and CSS"
```
Copy a milestone's files over your working folder, commit, and continue with the next. (`.env` and `node_modules` are in `.gitignore` and must never be committed.)
