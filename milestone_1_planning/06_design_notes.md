# 06. Design Notes (inspection of the existing project)

The site already has a brand. **We keep it.** This page records what we found so everybody builds in the same style.

## Colors (CSS variables in `style.css`)

| Name | Hex | Used for |
| --- | --- | --- |
| `--cream` | `#eadec7` | Header and page background areas |
| `--cream-light` | `#f5eee0` | Page background |
| `--paper` | `#fbf7ee` | Cards and form panels |
| `--blue` | `#1b2b85` | Main text, outlines, headings (brand blue) |
| `--blue-dark` | `#121c5e` | Deep blue areas, hero overlay |
| `--red` | `#c82a1d` | Main buttons |
| `--maroon` | `#7a130c` | Small red text (readable on cream) |
| `--ochre` / `--ochre-dark` | `#e08a27` / `#b36f1d` | Accents and the card shadow |
| `--green` | `#1b6a3b` | Confirmed status |
| `--yellow` | `#ffcd00` | Small highlights |

## Fonts

- **Fraunces** (serif) for headings.
- **Inter** (sans-serif) for body text and forms.
- Both from Google Fonts.

## Existing sections we keep (in this order)

2. Header with logo and navigation (About, Menu, Gallery, Visit us, Reserve a table)
3. Hero with photo, headline and the reservation card
4. About
5. Featured menu
6. Gallery (photos open in a viewer)
7. Visit us (Calamba and Cabuyao)
8. Footer (links, social, staff login)

## Images (in `design-assets/`)

`logo-full.png`, `logo-wordmark.png`, `favicon.png`, `apple-touch-icon.png`, `drinks.jpg`, `cafe-interior.jpg`, `cafe-counter.jpg`, `record-shelf.jpg`, `seating-corner.jpg`, `wall-calendar.jpg`

## Style rules

- Rounded buttons with a thick blue outline; red for the main action.
- Cards on a paper-colored background with a blue border.
- Status badges: Pending (ochre), Confirmed (green), Cancelled (maroon), Completed (blue), No-show (warm gray).
- Staff screens use the same colors and fonts, so they feel like part of the same cafe.

## Things we decided to improve without changing the look

- Visible keyboard focus, "skip to content" link, labels on every field.
- Messages under fields, not pop-up alerts.
- A phone layout where the staff table becomes cards.
- Details the owner has not given are not invented. After the manager interview, the Calamba address and both branches' hours are confirmed; the site says the Cabuyao address and a phone/email will be added soon, and the menu items are samples with no prices.
