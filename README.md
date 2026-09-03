# FlatFinder

A rental property marketplace MVP (flats, apartments, PGs, rooms) for the
Indian market — React/TypeScript/Tailwind frontend + Express/PostgreSQL
backend, built from the product spec.

```
flatfinder/
  backend/    Express API + Prisma schema + seed data      → backend/README.md
  frontend/   React + TypeScript + Tailwind + React Router → frontend/README.md
```

## Quick start

You need Node 18+ and a PostgreSQL database (local install, or a free hosted
one from Neon/Supabase/Railway).

**1. Backend**

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed                # creates demo users + 24 properties
npm run dev                 # http://localhost:4000
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173`. Log in with the seeded admin account
(password `password123`):

- Admin: `admin@flatfinder.in`

## What's real vs. what's stubbed

This is a working full-stack app, not a static mockup — auth, search/filter,
favorites, enquiries, visit scheduling, and the post-property flow all round-trip
through the real API into Postgres. What's intentionally out of scope for this
pass (see `backend/README.md` for the full list): an admin approval UI, real
Cloudinary image uploads (plain URLs work fine for now), live chat/push
notifications, Google login, and dedicated PG/flatmate profile fields. The data
model already supports most of these — happy to build any of them out next.

## Deploying

- **Frontend:** Vercel — root directory `frontend`, build command `npm run build`,
  output `dist`. Set `VITE_API_URL` to your deployed backend's `/api` URL.
- **Backend:** Render or Railway — root directory `backend`, build command
  `npm install && npx prisma generate && npx prisma migrate deploy`,
  start command `npm start`. Add a Postgres instance and set the env vars from
  `.env.example`, including `GOOGLE_CLIENT_ID`, plus `CORS_ORIGIN` pointing at your deployed frontend URL.
