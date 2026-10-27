# 05. Planned Folder Structure

```
TheSiftedCafe/
├── public/                  everything the browser receives
│   ├── index.html           public website + reservation form
│   ├── login.html           staff sign-in
│   ├── admin.html           staff dashboard
│   ├── css/style.css        all styles (shared, website, staff)
│   ├── js/app.js            public page behavior
│   ├── js/login.js          login page behavior
│   ├── js/admin.js          dashboard behavior
│   └── assets/              logo and photos
├── server/server.js         the backend (one file, numbered parts)
├── tests/                   automatic tests
├── docs/                    guides
├── database.sql             creates the database and table
├── database_update.sql      only for databases made with an older version
├── .env.example             template for secrets (copied to .env)
├── .gitignore               keeps .env and node_modules out of Git
├── package.json             dependencies and npm commands
└── README.md
```

## Rules we agreed on

1. **One job per file.** HTML = structure, CSS = looks, JS = behavior.
2. **Browser code in `public/`, server code in `server/`.** Nothing secret ever goes in `public/`.
3. **Beginner-style code:** clear names, plain functions, comments that explain *why*.
4. **No frameworks and no extra libraries** beyond express, mysql2 and dotenv.
5. **Never commit `.env` or `node_modules`.**

## How the code grows (see the milestones)

| Milestone | Folders and files that appear |
| --- | --- |
| 2 | `index.html`, `css/`, `assets/` |
| 3 | `js/app.js` (+ a temporary fake server file) |
| 4 | `login.html`, `admin.html`, `js/login.js`, `js/admin.js` |
| 5 | `server/`, `database.sql`, `package.json`, `.env.example`, `tests/` |
| 6 | login and session code in `server.js`, protected pages |
| 7 | update and delete routes and dialogs |
| 8 | API tests, `docs/`, final README |
