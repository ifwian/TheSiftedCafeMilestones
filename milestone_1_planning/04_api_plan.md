# 04. API Plan (routes the server will have)

The browser talks to the server with `fetch` and JSON. "API" here simply means the list of addresses (routes) the server answers.

## Public

| Method | Address | Does | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/api/reservations` | Check and save a new reservation (status `pending`) | 201 + reference | 400 field errors, **409 time slot full**, 429 too many, 503 database down |
| GET | `/api/health` | Is the server and database working? | 200 | 503 |

## Staff login

| Method | Address | Does |
| --- | --- | --- |
| POST | `/api/login` | Check username and password, start a session (cookie) |
| POST | `/api/logout` | End the session |
| GET | `/api/me` | Who is signed in? (401 if nobody) |

## Staff only (every one of these needs a session, otherwise 401)

| Method | Address | Does | SQL |
| --- | --- | --- | --- |
| GET | `/api/admin/summary` | Counts per status | `GROUP BY status` |
| GET | `/api/admin/reservations?search=&status=&branch=&dateFrom=&dateTo=&sort=` | The list | `SELECT ... WHERE ... ORDER BY` |
| GET | `/api/admin/reservations/:id` | One reservation | `WHERE id = ?` |
| PUT | `/api/admin/reservations/:id` | Edit all details | `UPDATE ... WHERE id = ?` |
| PATCH | `/api/admin/reservations/:id/status` | Change only the status | `UPDATE ... SET status = ?` |
| DELETE | `/api/admin/reservations/:id` | Delete | `DELETE ... WHERE id = ?` |

## Pages

| Address | Who | Notes |
| --- | --- | --- |
| `/` | everyone | `index.html` |
| `/login` | everyone | `login.html` |
| `/admin` | signed-in staff only | others are redirected to `/login` |

## Example: create a reservation

Request body (JSON):
```json
{ "customer_name": "Ana Dela Cruz", "phone": "0917 123 4567", "email": "ana@example.com",
  "branch": "calamba", "guests": 4, "reservation_date": "2026-10-30",
  "reservation_time": "18:00", "occasion": "Birthday", "allergies": "No peanuts",
  "special_requests": "Window seat" }
```
Answer when everything is fine (201):
```json
{ "message": "Your reservation request has been received. It is NOT confirmed yet...",
  "reservation": { "reference": "SC-00012", "status": "pending", "...": "..." } }
```
Answer when a field is wrong (400):
```json
{ "error": "Please fix the highlighted fields.", "errors": { "phone": "Contact number must have between 7 and 15 digits." } }
```

## Status codes we will use

200 OK, 201 created, 400 bad data, 401 not signed in, 403 blocked, 404 not found, **409 that time is full**, 429 too many requests, 503 database unavailable.
