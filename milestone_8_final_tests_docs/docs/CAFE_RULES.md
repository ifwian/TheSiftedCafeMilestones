# Cafe Rules (from the staff interview)

On **10/15/2026** the **Calamba branch manager** answered our "Staff Interview Questionnaire: Reservation Website". This page records the answers and shows exactly where each one is in the project. Show it to your professor: it proves the rules come from the real cafe, not from us.

## Answers and what we did with them

| # | Question | Answer given | How the project follows it |
| --- | --- | --- | --- |
| 1 | Branch address and contact | Calamba: Unit 2, Pabs2men, Chipeco Ave, Barangay 3, Calamba, Laguna. **No phone or email given** | Calamba address on the site is confirmed. Phone and email were not given, so the site says they will be added soon |
| 2 | Opening hours | The old records were wrong. Correct: **Calamba 10:00 AM to 10:00 PM, Cabuyao 9:00 AM to 9:00 PM** | "Visit us" shows these hours. `BRANCH_HOURS` in `server/server.js` and `public/js/app.js` |
| 3 | Reservation times | **Every hour.** Latest time before closing: *not answered* | Hourly slots. We **assumed the last request is 1 hour before closing**: Calamba 10:00 to 9:00 PM, Cabuyao 9:00 AM to 8:00 PM |
| 4 | Notice and advance booking | **At least 1 day notice** (no same-day). How far ahead: *not answered* | The earliest date is tomorrow (Manila time). We kept **60 days ahead** as a placeholder (assumption) |
| 5 | Group size online | **2 to 10 guests** | Public form accepts 2 to 10. Staff edits accept 1 to 20 (bigger groups booked by phone) |
| 6 | Table capacity | **20 guests** at the same time slot at each branch | The server adds up the guests already booked (pending + confirmed) and answers **409 "fully booked"** if the new request would pass 20 |
| 7 | Confirming | **Staff confirm every request** (manually). How soon / who: *not answered* | Every request starts as *Pending*; staff confirm in the dashboard. We do not promise a reply time anywhere on the site |
| 8 | Late arrival | **Hold the table 15 minutes.** Cancellation deadline: *not answered* | The form and the success message say the table is held for 15 minutes. No cancellation deadline is shown |
| 9 | Customer details | **Email required**, plus **occasion** (birthday, meeting) and **allergies or special needs** | Email is required for customers. New optional fields *Occasion* and *Allergies*, saved in new database columns and shown in the dashboard |
| 10 | Keeping records | **6 months**, then old records may be deleted | The server deletes reservations whose date is older than 6 months when it starts, and once a day while running (`RETENTION_MONTHS`, `0` turns it off) |

## Still waiting for the owner

1. Phone number and email to show on the website.
2. The latest reservation time before closing (we assume 1 hour).
3. How far ahead customers may reserve (we kept 60 days).
4. Who confirms requests and the usual reply time.
5. Until when a customer may cancel or change a reservation.
6. The **Cabuyao** address, and a check of the Cabuyao hours (they came from the Calamba manager).
7. The real menu and prices (the site shows six sample items with no prices).

## Notes and limits of what we built

- **Capacity counts pending and confirmed requests.** Cancelled, completed and no-show ones do not use seats. If a staff member cancels a booking, the seats are free again.
- **Staff edits do not check capacity.** Staff decide, and may need to fit a phone booking. This is a choice, not a bug.
- **Two customers sending at the very same moment** could both pass the capacity check. A real system would use a database transaction. For a school project we accept this and say it openly.
- **Deleting after 6 months is automatic.** Records are counted by the **reservation date**, not the date the form was sent. Back up first if you want to keep anything.
- **The interview was answered by the Calamba manager**, and also gave the Cabuyao hours. We should confirm Cabuyao with its own staff.
- The handwriting for "Pabs2men" was read as written. Check the spelling of the building name with the cafe.
