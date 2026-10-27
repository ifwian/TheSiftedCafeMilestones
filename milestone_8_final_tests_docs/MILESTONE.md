# Milestone 8: Testing and documentation (final)

The finished project: the Milestone 7 code plus the **API tests**, the **project guide**, the **defense reviewer** and the **testing report**.

## What is new in this milestone

- `tests/api.test.js`: 19 tests against the running server (create, cafe rules, capacity, login, protection, search, full CRUD, logout)
- `docs/PROJECT_GUIDE.md`: how everything works with code snippets
- `docs/CAFE_RULES.md`: the manager interview answers and where each rule is used
- `docs/DEFENSE_REVIEWER.md`: 36 likely professor questions with short answers
- `docs/TESTING.md`: exactly what was tested and what was not
- `README.md`: full setup, manual checklist, common errors, security limits

## What to show your professor (demo steps)

1. `npm test` (20 unit tests), then start the server and in a second terminal `npm run test:api` (19 tests).
2. Walk through the manual checklist in `README.md`.
3. Show `docs/DEFENSE_REVIEWER.md` and `docs/TESTING.md`.

## What is NOT done yet (say this openly)

- See "Known limitations" in `README.md` and `docs/TESTING.md`.

## What to say (talking points)

- We wrote tests for the server rules and for the whole API so a change cannot silently break something.
- We are honest about what we tested and what still needs checking on our own computers.

## Questions your professor may ask

**What did you test?**
Unit tests for validation, API tests for every route, and a manual checklist in the browser. Details are in `docs/TESTING.md`.

## Honest note

AI (Claude) helped build this project. Be ready to explain every file in this milestone in your own words.
