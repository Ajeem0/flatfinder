# FlatFinder API

Express + PostgreSQL (via Prisma) backend for the FlatFinder rental marketplace.

## What's implemented

- JWT auth: register, login, get/update profile (`/api/auth`)
- Property search with filters (city, rent range, BHK, furnishing, amenities,
  bachelor/family/pet friendly, no-brokerage, available-from) + pagination + sorting (`/api/properties`)
- A small rule-based "smart search" parser for free-text queries like
  `"2 BHK under 20k in Jaipur"` (`src/utils/smartSearch.js`) — wired into `GET /api/properties?q=...`
- Property CRUD for owners/agents, with new listings starting as `PENDING`
  until an admin approves them (`status` field)
- Favorites toggle + list (`/api/favorites`)
- Enquiries (contact owner) with phone-number reveal only after an enquiry is sent (`/api/enquiries`)
- Visit scheduling (`/api/visits`)
- Cities/localities lookup for the search bar (`/api/locations`)
- Seed script with 5 owners/agents, 1 tenant, 1 admin, and 24 realistic
  properties across 7 Indian cities

## What's NOT implemented (out of scope for this pass)

- Admin approval UI/endpoints (the `status` field and data model support it,
  but there's no `/api/admin/*` route yet)
- Image upload to Cloudinary — properties store plain image URLs; wire up
  Cloudinary's Node SDK in `POST /api/properties` if you want real uploads
- Real-time chat/messages, push notifications
- PG-specific fields (sharing type, food included) and flatmate-specific
  fields beyond what's in the general `Property` model
- Google login (email/password only)

These are all straightforward to add on top of this schema — ask if you want
any of them built out next.

## Setup

1. Install PostgreSQL locally (or use a hosted instance — Neon, Supabase, Railway all work).
2. `cp .env.example .env` and fill in `DATABASE_URL` and `JWT_SECRET`.
3. Install dependencies and generate the Prisma client:

   ```bash
   npm install
   npx prisma generate
   ```

4. Create the database tables:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Seed demo data:

   ```bash
   npm run seed
   ```

6. Start the dev server:

   ```bash
   npm run dev
   ```

The API runs on `http://localhost:4000` by default. Health check: `GET /api/health`.

## Demo accounts (password for all: `password123`)

- Admin: `admin@flatfinder.in`
- Tenant: `tenant@flatfinder.in`
- Owners: `owner1@flatfinder.in` … `owner4@flatfinder.in`
- Agent: `owner4@flatfinder.in` (every 4th seeded owner is an AGENT)

## Key endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/me

GET    /api/properties?city=Jaipur&minRent=8000&maxRent=20000&bhk=1,2&sort=newest
GET    /api/properties?q=2+BHK+under+20k+in+Jaipur
GET    /api/properties/:idOrSlug
POST   /api/properties            (owner/agent, auth required)
PUT    /api/properties/:id        (owner only)
DELETE /api/properties/:id        (owner only)
POST   /api/properties/:id/favorite

GET    /api/favorites

POST   /api/enquiries
GET    /api/enquiries?asOwner=true

POST   /api/visits
GET    /api/visits?asOwner=true
PUT    /api/visits/:id

GET    /api/locations
```

## Notes on deploying

- Render/Railway both auto-detect this as a Node app — set the same env vars
  from `.env.example` in their dashboard, add a Postgres add-on, and set the
  build command to `npm install && npx prisma generate && npx prisma migrate deploy`.
- Update `CORS_ORIGIN` to your deployed frontend URL once you have one.
