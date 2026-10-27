# Milestone 1: Planning

**Goal:** decide what we are building **before** writing code. No code in this folder, only planning documents.

## Contents

| File | What it is |
| --- | --- |
| `01_project_plan.md` | The problem, goal, users, scope, features, technology choices, **the 8-milestone roadmap**, risks, team table |
| `02_wireframes.html` | Open it in a browser: gray-box layouts of every page, phone layout, dialogs, and the page flow |
| `03_database_design.md` | The `reservations` table, columns, status life cycle, draft SQL |
| `04_api_plan.md` | The routes the server will have, with example requests and answers |
| `05_folder_structure.md` | The planned folders and the rules we agreed on |
| `06_design_notes.md` | What we found in the existing project: colors, fonts, sections, images (we keep the brand) |
| `07_test_plan.md` | What we will test and in which milestone |
| `08_interview_results.md` | The cafe manager's interview answers (10/15/2026) and the rules we took from them |
| `design-assets/` | The existing logo and photos we will reuse |

## What to show your professor

1. Open `02_wireframes.html` and walk through the public page, the staff dashboard and the page flow.
2. Show the roadmap table in `01_project_plan.md`: "this is how we will build it step by step".
3. Show the database design and the status life cycle.
4. Show that the design notes come from the **existing** site: we keep its look.

## What is NOT done yet

Everything else. There is no HTML, CSS, JavaScript, server or database in this milestone, on purpose.

## What to say

- We inspected the existing project first and wrote down its colors, fonts, sections and photos so we keep the brand.
- We **interviewed the Calamba manager** and built the rules from her answers: hourly times, 2 to 10 guests online, 1 day notice, 20 guests per slot, required email, 6-month record keeping. Where she left something blank we say what we assumed.
- We chose one table, because a reservation is one self-contained record.
- We planned the routes and the tests before coding, so we know what "done" means.
- We split the work into 8 small milestones, each one runnable and demonstrable.

## Questions your professor may ask

**Why only one table?** Customers do not have accounts, and a reservation does not need other tables. One table keeps the CRUD easy to explain. Later, a `branches` table or a `users` table could be added.

**Why plan the API before building it?** The browser team and the server team can work separately and still fit together, because they agreed on the routes and the JSON.

**Why wireframes?** To agree on layout without arguing about colors and photos.
