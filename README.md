# RouteWay

Find a route between two stops, see the fare and full stop sequence, and leave feedback if
something's outdated. Admins log in separately to add/edit routes, stops, and fares — changes
are instantly searchable because both sides read from the same MySQL database.

## Stack
- **Frontend:** Next.js (App Router) — plain CSS, no extra UI libraries
- **Backend:** Node.js + Express, REST API
- **Database:** MySQL (via `mysql2`)
- **Auth:** JWT for admin sessions, bcrypt for password hashing

## How the core loop works
1. Commuter picks **From** and **To** on the homepage and searches.
2. Frontend calls `GET /api/search?from=...&to=...`.
3. Backend joins `route_stops` to itself on `route_id`, matching one row where the stop name
   equals `from` and another where it equals `to`, and only keeps the pair where
   `from.stop_order < to.stop_order` — that's what enforces direction (Ratnapark → Koteshwor
   is a different match than Koteshwor → Ratnapark).
4. For each matching route it pulls the fare (`fares` table) and the full ordered stop list
   (`route_stops` joined to `stops`), and returns it as JSON.
5. Frontend renders each match as a card: vehicle name, fare, a stop-by-stop line diagram, and
   a rough ETA.
6. Optional feedback on a result posts to `POST /api/feedback` and lands in the `feedback`
   table for admin review.
7. Admins log in at `/admin` (`POST /api/admin/login` → JWT), then manage routes/stops/fares
   and feedback status from `/admin/dashboard`. Every write goes through the same MySQL tables
   the search query reads from, so new routes are searchable immediately.

## Project layout
```
routeway/
  backend/
    db.sql                  # schema + seed data (Ratnapark→Koteshwor example route included)
    .env.example
    src/
      config/db.js           # mysql2 connection pool
      middleware/auth.js      # JWT verification for admin routes
      routes/search.js        # public: GET /api/search, GET /api/search/stops
      routes/feedback.js      # public: POST /api/feedback
      routes/adminAuth.js     # public: POST /api/admin/login
      routes/adminRoutes.js   # protected: CRUD for routes/stops/fares, feedback review
      scripts/seedAdmin.js    # creates the first admin account
      server.js
  frontend/
    app/
      page.js                 # commuter search page
      admin/page.js            # admin login
      admin/dashboard/page.js  # admin dashboard (routes/stops/feedback tabs)
      layout.js
      globals.css
    lib/api.js                 # fetch wrapper for the backend API
```

## Setup

### 1. Database
Make sure MySQL is running locally, then:
```bash
mysql -u root -p < backend/db.sql
```
This creates the `routeway` database, all tables, and seeds two example routes — including
**Route 5 — Sajha Yatayat** running Ratnapark → Sundhara → Baneshwor → Koteshwor, so the exact
flow you described works out of the box.

### 2. Backend
```bash
cd backend
cp .env.example .env      # then edit DB_PASSWORD, JWT_SECRET, etc.
npm install
npm run seed:admin         # creates admin/admin123 (change these first in .env)
npm run dev                 # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Open `http://localhost:3000`, search Ratnapark → Koteshwor, and you should see Route 5 with its
fare and stop list. Admin dashboard is at `http://localhost:3000/admin`.

## API reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/search?from=&to=` | none | Find routes between two stops (direction-aware) |
| GET | `/api/search/stops` | none | List all stops (for autocomplete) |
| POST | `/api/feedback` | none | Submit feedback on a route/fare |
| POST | `/api/admin/login` | none | Get a JWT |
| GET/POST | `/api/admin/routes` | JWT | List / create routes |
| GET/PUT/DELETE | `/api/admin/routes/:id` | JWT | Read / update / delete a route |
| GET/POST/DELETE | `/api/admin/stops` , `/api/admin/stops/:id` | JWT | Manage stops |
| GET/PATCH | `/api/admin/feedback` , `/api/admin/feedback/:id` | JWT | Review feedback |

## Notes on scope
This covers exactly the loop you described (search → matched route → fare + stops → feedback,
and a separate admin CRUD side writing to the same DB). Maps, favorites, multi-leg transfers,
and analytics are intentionally left out as later enhancements, as you said — the schema
(`stops`, `routes`, `route_stops`, `fares`, `feedback`, `admins`) is built so those can be added
without restructuring what's here (e.g. transfers would mean stitching two matched routes
together at a shared stop, which the same `route_stops` table already supports).
