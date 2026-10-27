# Milestone 4: Staff screens and polish

The staff side is built: login page and dashboard with search, filters, dialogs, edit, status buttons and delete. It still runs on **demo data in the browser** (no server yet). This milestone is also where the whole interface gets its final polish.

## How to open it

Double-click `index.html` (or use Live Server). Staff login: **admin** / **demo123** (demo only; the real login comes in Milestone 6).

## What is new in this milestone

- `login.html` + `js/login.js`: staff sign-in page
- `admin.html` + `js/admin.js`: the dashboard (count cards, search and filters, table, View / Edit / status / Delete windows)
- `css/style.css`: now includes the STAFF part
- `js/demo-api.js`: the fake server now also answers login and the staff routes
- `index.html`: footer link to the staff login appears

## What to show your professor (demo steps)

1. Open `admin.html` without signing in: you are sent to `login.html`.
2. Wrong password shows an error. Sign in with admin / demo123.
3. Dashboard: click the count cards (they filter the list), type in the search box, use Status / Branch / Date filters and Sort, press Clear filters.
4. **View** a reservation, then press **Confirm**: the badge and the count cards update.
5. **Edit**: type 99 in Guests and Save: the message appears under that field (staff may enter 1 to 20). Fix it and save. The window also has the new **Occasion** and **Allergies** fields.
6. **Delete**: a confirmation window appears first. "Keep it" does nothing, "Yes, delete" removes it.
7. Make a reservation on `index.html`, then sign in: it is in the dashboard (the fake database is shared by both pages).
8. Phone-size window: the table turns into cards.

## Polish added here

- Keyboard: visible focus, skip link, dialogs trap focus and close with Esc (native `<dialog>`).
- Screen readers: labels on all fields, `aria-live` for status messages, `aria-label` on row buttons ("View SC-00001 for Ana").
- Clear states: loading text, empty list message, "No reservations match these filters" with a Clear button, error with "Try again".
- Search waits 300 ms after typing stops (fewer requests) and old answers cannot replace newer ones.
- Phone layout: staff table becomes cards (`data-label` + CSS `attr()`).
- `prefers-reduced-motion` respected; small toast messages instead of pop-up alerts.

## What is NOT done yet (say this openly)

- The login is fake (admin / demo123 is in the demo file, visible to anyone). The real one uses `.env` on the server (Milestone 6).
- Data lives in the browser, not in MySQL (Milestone 5).
- No real protection of staff pages yet: demo only.

## What to say (talking points)

- The staff screens use the same theme as the public site.
- Every piece of customer text is added with `textContent`, so it cannot run as code.
- We separated "what the page does" (admin.js) from "where the data comes from" (fetch), so swapping the fake server for the real one needs **no change** in admin.js.
- Dialogs use the built-in HTML `<dialog>` element: less code, better accessibility.

## Questions your professor may ask

**Why is the staff login not secure in this milestone?**
Because a fake server inside the browser answers it, and the password is in a public file. Real security must live on the server. That is exactly what Milestone 6 adds.

**What does the debounce on the search box do?**
It waits 300 ms after the last key before searching, so typing "carla" sends one request instead of five.

**Why do you use `textContent` instead of `innerHTML`?**
`innerHTML` would run any HTML or script a customer typed (XSS). `textContent` always treats it as plain text.

## Honest note

AI (Claude) helped build this project. Be ready to explain every file in this milestone in your own words.
