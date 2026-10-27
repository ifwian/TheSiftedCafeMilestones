# Milestone 3: JavaScript (browser side)

Now the public page **behaves**: menu, photo viewer, and a reservation form that checks itself and "sends" the request. There is still **no real server**, so a small fake one lives inside the browser.

## How to open it

Double-click `index.html` or use Live Server. No Node or MySQL needed.

## What is new in this milestone

- `js/app.js`: the real behavior of the page (menu, gallery viewer, per-branch times, form checks, sending with `fetch`)
- `js/demo-api.js`: **temporary** fake server. It catches `fetch("/api/reservations")` and answers like the real server will. Saved in the browser's `localStorage`. **Deleted in Milestone 5.**
- `index.html`: now loads the two scripts. The footer "Staff login" link is still hidden until Milestone 4.

## What to show your professor (demo steps)

1. Phone-size window: the menu button now opens and closes the navigation.
2. Click a gallery photo: a bigger viewer opens. Esc closes it; arrow buttons / arrow keys move between photos.
3. Choose **Calamba**: the Time list starts at 10:00 AM. Choose **Cabuyao**: it starts at 9:00 AM. The date picker starts **tomorrow** (the cafe needs 1 day notice).
4. Press Send with the form empty or wrong (letters in the phone, no email, 1 guest, today's date): red messages appear under the fields and the first wrong field gets focus. Online groups are 2 to 10 guests.
5. Fill the form correctly and send: the card changes to "Request received" with a reference like `SC-00005` and the status **Pending**. Press "Make another request" to reset.
6. Open F12, *Application, Local Storage*: you can see the saved list. This is our temporary stand-in for MySQL.
7. The yellow label at the bottom left says DEMO MODE, so nobody is fooled.

## What is NOT done yet (say this openly)

- No real server and no real database. Data exists only in this browser and disappears if you clear site data.
- The fake server only checks the main rules. The real server (Milestone 5) checks every rule again, **and** the 20-guests-per-slot capacity (the fake server cannot).
- No staff pages yet.

## What to say (talking points)

- JavaScript reads the form, checks each field, and shows messages without reloading the page.
- `fetch` sends the data as JSON to an address (`/api/reservations`). Today a fake answers; later Express will answer. **The page code does not change**, which is why we built it this way.
- We use `textContent` and never `innerHTML` for text from users, so nobody can inject HTML.
- A hidden "website" field catches simple bots (honeypot).

## Questions your professor may ask

**What is `fetch`?**
The browser function that sends a request to a server and waits for the answer, without reloading the page.

**What is JSON?**
A text format for objects, like `{"guests": 4}`, used to send data between browser and server.

**Why check the form in JavaScript if the server will check again?**
Browser checks are fast and friendly for honest users. Server checks are the ones we trust, because browser checks can be skipped.

**What is `localStorage`?**
A small storage in the browser that keeps text after the page is closed. We use it only as a temporary stand-in for the database.

## Honest note

AI (Claude) helped build this project. Be ready to explain every file in this milestone in your own words.
