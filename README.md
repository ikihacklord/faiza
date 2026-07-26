# Sunrise HRMS — full-stack prototype (with login & SQL database)

A working prototype of the Hospital Records Management System described in the
project proposal for Sunrise Hospital, Kiambu County — now with real staff
accounts (sign up / log in) and a SQL database that keeps your data between
sessions.

## What changed from the front-end-only version

- **Sign up / log in page** (`public/login.html`) — staff create an account
  with name, email, password, and role; passwords are hashed, never stored
  in plain text.
- **A real backend** (`server.js`) — a small Node.js HTTP server with a JSON
  API. No Express, no external packages — it only uses Node's built-in
  modules, so there's nothing to `npm install`.
- **A real SQL database** (`sunrise.db`) — built with Node's built-in
  `node:sqlite` module (SQLite). Every patient, record, and appointment you
  add is written to disk and is still there the next time you start the
  server.
- **Sessions** — logging in sets a secure, HTTP-only cookie; the app checks
  it on every page load and redirects to the login page if you're signed out.

## Requirements

- **Node.js v22.5 or later** (this uses the built-in SQLite module, which is
  new — check your version with `node -v`; upgrade from
  [nodejs.org](https://nodejs.org) if needed).

## Running it

```bash
cd sunrise-hrms
node server.js
```

Then open **http://localhost:3000** in your browser. You'll land on the
login page — use "Create staff account" to sign up the first time.

The server prints where the database file lives, e.g.:

```
Sunrise HRMS running at http://localhost:3000
Database file: /path/to/sunrise-hrms/sunrise.db
```

That `sunrise.db` file is your database. Delete it and restart the server to
reset everything back to the seeded demo data (6 sample patients).

## Project structure

```
sunrise-hrms/
├── server.js            # HTTP server + REST API (routes + static files)
├── package.json
├── db/
│   └── schema.js         # creates tables, seeds demo data on first run
├── lib/
│   └── auth.js           # password hashing, session helpers
├── public/               # everything served to the browser
│   ├── login.html         # sign up / log in page
│   ├── index.html         # the main app (requires a session)
│   ├── css/styles.css
│   └── js/
│       ├── login.js        # login page logic
│       └── app.js          # main app logic — talks to the API
└── sunrise.db            # created automatically on first run
```

## Database schema

```
users          id, full_name, email (unique), password_hash, password_salt, role, created_at
sessions       id (token), user_id, created_at, expires_at
patients       id, mrn (unique), name, dob, gender, phone, department, registered
records        id, patient_id, type, entry_date, author, notes
appointments   id, patient_id, appt_date, appt_time, department, doctor, status
```

Roles are one of: `admin`, `doctor`, `nurse`, `labtech`, `reception` — same
set used to decide which modules a signed-in user can see in the sidebar.

## API reference

All routes return JSON. Routes other than signup/login/logout require a
valid session cookie (sent automatically by the browser).

| Method | Route              | Purpose                                |
|--------|---------------------|-----------------------------------------|
| POST   | `/api/signup`        | Create a staff account, start a session |
| POST   | `/api/login`         | Log in, start a session                 |
| POST   | `/api/logout`        | End the session                         |
| GET    | `/api/me`             | Get the signed-in user                  |
| GET    | `/api/patients`       | List all patients                       |
| POST   | `/api/patients`       | Register a new patient                  |
| GET    | `/api/records`        | List records (optionally `?patientId=`) |
| POST   | `/api/records`        | Add a record (consultation/lab/prescription) |
| GET    | `/api/appointments`   | List all appointments                   |
| POST   | `/api/appointments`   | Book an appointment                     |

## Opening it in VS Code

Just open the `sunrise-hrms` folder (`File → Open Folder…`). Run the server
from VS Code's integrated terminal with `node server.js` — no extensions
required this time, since it's a real server rather than a static page.

## Notes on the "SQL database" choice

This uses **SQLite** rather than a separate MySQL server, so the whole thing
runs with zero setup — no database server to install, no connection strings,
no passwords to configure. It's genuinely a SQL database (the schema above is
plain SQL, and you can inspect `sunrise.db` with any SQLite browser, e.g. the
free [DB Browser for SQLite](https://sqlitebrowser.org/)).

If your coursework specifically requires **MySQL** (as mentioned in the
proposal's resources section), the schema in `db/schema.js` is close to
plain SQL already — swapping the data layer for MySQL mainly means:
1. Installing `mysql2` (`npm install mysql2`) and running an actual MySQL
   server.
2. Rewriting `db/schema.js` and the `db.prepare(...).run(...)`/`.get()`/`.all()`
   calls in `server.js`/`lib/auth.js` to use `mysql2`'s query API instead.

Happy to do that conversion for you if your supervisor wants MySQL
specifically rather than SQLite.

## Security notes (this is a student prototype)

- Passwords are hashed with `scrypt` (Node's built-in, industry-standard KDF)
  — never stored in plain text.
- Signup currently lets anyone choose "Administrator" for demo convenience.
  A production system would have an existing admin invite/approve new staff
  accounts instead of self-service admin signup.
- There's no HTTPS here — for real deployment, put this behind a reverse
  proxy (e.g. nginx) with TLS.
