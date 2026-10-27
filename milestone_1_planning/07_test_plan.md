# 07. Test Plan (what we will check, and when)

We write the plan **before** building, so we know what "working" means.

| ID | Check | Milestone | How |
| --- | --- | --- | --- |
| T1 | All sections show and all images load | 2 | Open the page, scroll |
| T2 | Page does not scroll sideways on a phone-sized window | 2 | Browser dev tools, device mode |
| T3 | Menu button opens on phone | 3 | Click |
| T4 | Empty / wrong form shows messages and does not send | 3 | Try empty, letters in phone, past date, 25 guests |
| T5 | Correct form shows a success message with a reference | 3 | Fill and send |
| T6 | Staff screens look right on desktop and phone | 4 | Dev tools |
| T7 | Reservation appears in MySQL as `pending` | 5 | `SELECT * FROM reservations` in Workbench |
| T8 | Bad data is refused by the **server** too | 5 | Automatic tests |
| T8a | Cafe rules: 2 to 10 guests, no same-day, hourly times inside each branch's hours, email required | 3 and 5 | Form and automatic tests |
| T8b | Capacity: 20 guests per slot per branch (10 + 8 fit, 3 more get "full") | 5 | Automatic tests |
| T8c | Records older than 6 months are deleted | 5 | Small test database |
| T9 | Visitors cannot open `/admin` or the staff API | 6 | Open in a private window |
| T10 | Wrong password refused, right password works, logout works | 6 | Manual |
| T11 | Dashboard lists, searches and filters real rows | 6 | Manual |
| T12 | Edit, status change and delete **persist after refresh** | 7 | Manual + check in Workbench |
| T13 | Delete asks first; Cancel keeps the row | 7 | Manual |
| T14 | If MySQL is stopped, the user sees a friendly message | 7 | Stop MySQL service |
| T15 | Automatic tests pass | 8 | `npm test` and `npm run test:api` |

Results go into the milestone's notes. If we could not test something, we say so.
