# Pompano Beach Pointe Residences — Backend Build Brief
> Give this entire file to Claude Code as your opening prompt.

---

## Project Overview

I am building a **direct hotel booking system** for **Pompano Beach Pointe Residences** — a short-term rental property in Pompano Beach, Florida. The property has **17 real rental units** ranging from Efficiency studios ($100/night) to Two-Bedroom apartments ($250/night).

The goal is a direct booking website so guests can book without going through Airbnb or VRBO — eliminating platform fees. The property is currently listed on Airbnb and VRBO, and each unit has an **iCal feed URL** that we must sync every 2 hours to prevent double bookings.

---

## System Architecture

There are three completely separate servers:

```
Customer Frontend (Next.js + Clerk) --- pbpointe.com
Admin Frontend    (Next.js + Clerk) --- admin.pbpointe.com
        |                                      |
        +------------------+-------------------+
                           |
                    NestJS Backend
                    api.pbpointe.com
                           |
                    PostgreSQL (Prisma)
                           |
          +----------------+----------------+
          |                |                |
       Stripe          Cloudinary      Airbnb/VRBO
    (Payments)       (File Upload)    (iCal Feeds)
```

You are building the NestJS backend only. The two frontends are built separately.

---

## Authentication: Clerk (Managed Auth — Read Carefully)

Authentication is handled entirely by **Clerk** (clerk.com). This means:

### What you DO NOT build
- No login endpoint
- No register endpoint
- No logout endpoint
- No /me endpoint
- No express-session
- No connect-pg-simple
- No bcrypt or password hashing
- No Session table in PostgreSQL
- No SessionGuard based on cookies

### How Clerk works in this system
1. Users sign up / log in on the frontend using Clerk components (@clerk/nextjs)
2. Clerk issues a signed JWT session token to the frontend
3. Every protected API request from the frontend includes: Authorization: Bearer <clerk-token>
4. The NestJS backend verifies this token using @clerk/backend verifyToken()
5. If valid, the Clerk userId is extracted from the token and used to identify the user in your PostgreSQL database

### The only auth-related endpoint you build
```
POST /api/auth/sync
```
This is called ONCE by the frontend immediately after a user signs up via Clerk.
It upserts the user into your PostgreSQL User table using the Clerk userId.
Body: { clerkId: string, name: string, email: string }
Returns: { id, name, email, role }

### ClerkGuard — replaces SessionGuard
```typescript
@Injectable()
export class ClerkGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    request.auth = { userId: payload.sub }; // Clerk userId
    return true;
  }
}
```

### AdminGuard — checks role in YOUR database
```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkUserId = request.auth?.userId;
    if (!clerkUserId) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({ where: { id: clerkUserId } });
    if (!user || user.role !== 'ADMIN') throw new ForbiddenException();
    return true;
  }
}
```

### Admin role
Clerk does NOT manage roles. Roles (GUEST / ADMIN) live in your PostgreSQL User table.
Admin role is assigned directly in the DB — no public API to self-promote.
To make someone admin: UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@pbpointe.com';

### Two-frontend login flow
Customer Frontend:
- Guest logs in via Clerk -> gets token -> calls protected API with Bearer token
- If user.role === ADMIN -> show "Visit admin portal" message

Admin Frontend:
- Admin logs in via Clerk -> gets token -> frontend calls GET /api/admin/me (or /api/auth/sync)
- Backend checks role in DB -> if not ADMIN -> return 403 -> frontend shows "Access Denied"
- If ADMIN -> frontend loads dashboard

---

## Tech Stack — Use Exactly This

```
Backend Framework  : NestJS (TypeScript)
Database           : PostgreSQL
ORM                : Prisma
Authentication     : Clerk (@clerk/backend) — NO express-session, NO bcrypt
Auth Guard         : ClerkGuard verifies JWT from Authorization header
Admin Guard        : AdminGuard checks role in PostgreSQL
Validation         : class-validator + class-transformer
Payments           : Stripe (Checkout Sessions + Webhooks)
File Uploads       : Cloudinary (unit photos)
iCal Sync          : node-ical
Scheduling         : @nestjs/schedule (cron jobs)
API Style          : REST
CORS               : Both frontend URLs, credentials: true
Environment        : .env file — never hardcode secrets
```

---

## STEP ZERO — Documentation First. No Code Until I Approve.

Before writing a single line of source code, create a /docs folder at the project root with the following 10 files. They must be complete, detailed, and use Mermaid diagrams wherever architecture or flows are involved. I will review them and explicitly say "proceed" before you write any code.

```
docs/
├── 00-overview.md
├── 01-architecture.md
├── 02-database-schema.md
├── 03-api-contracts.md
├── 04-auth-flow.md
├── 05-booking-flow.md
├── 06-payment-flow.md
├── 07-ical-sync-flow.md
├── 08-domain-rules.md
├── 09-folder-structure.md
└── 10-environment-variables.md
```

### What Each File Must Contain

**00-overview.md**
Project name, business context, problem being solved (bypassing OTA fees), full tech stack including Clerk, all 17 unit names with types and prices, two-frontend architecture summary, deployment targets.

**01-architecture.md**
Full Mermaid diagram: Customer Frontend -> Clerk -> NestJS Backend -> PostgreSQL -> Stripe / Cloudinary / iCal feeds. Show how the JWT flows from Clerk to the frontend to the backend. Explain each layer and why this architecture was chosen.

**02-database-schema.md**
Full Prisma schema with explanation of every model, field, relation, and enum. Mermaid ER diagram. Explain that User.id is the Clerk userId (not a generated UUID). Explain why BlockedDate is a separate table. Explain BlockSource enum (BOOKING / ICAL / MANUAL).

**03-api-contracts.md**
Every endpoint: method, path, auth level (public / clerk / admin), request body with TypeScript types, response body with TypeScript types, all error codes. Organized by domain as tables.

**04-auth-flow.md**
Mermaid sequence diagrams for: New user signup (Clerk -> /api/auth/sync -> DB upsert), Login (Clerk -> token -> protected API call -> ClerkGuard -> AdminGuard), Admin login (role check in DB). Explain how ClerkGuard and AdminGuard work. Explain the two-frontend strategy.

**05-booking-flow.md**
Full Mermaid flowchart: Guest searches -> availability check -> selects dates -> login gate (redirect to Clerk if not logged in) -> booking created (PENDING) -> Stripe session -> guest pays -> webhook fires -> booking CONFIRMED -> dates blocked in BlockedDate.

**06-payment-flow.md**
Stripe Checkout Session creation, webhook signature verification (stripe.webhooks.constructEvent), handling checkout.session.completed and payment_intent.payment_failed, admin refunds via stripe.refunds.create, how refund updates booking status and removes BlockedDates.

**07-ical-sync-flow.md**
How each unit's iCal URL is stored in DB. How the cron job (@Cron every 2 hours) fetches, parses with node-ical, extracts dates, upserts into BlockedDate with source ICAL, updates icalLastSync. How manual sync is triggered by admin. How availability check treats all BlockSource values equally.

**08-domain-rules.md**
All business rules — service layer only, never controllers:
- Availability conflict: reject if ANY date in range exists in BlockedDate
- On payment confirmed: write all dates to BlockedDate source BOOKING
- Cancellation: 48hr rule, remove BOOKING-sourced rows only
- Review eligibility: COMPLETED booking + reviewed false
- Admin role: DB only
- Pricing formula
- Stripe webhook signature required
- Admin can only delete MANUAL-sourced BlockedDates
- Unit delete blocked if active bookings

**09-folder-structure.md**
Full annotated folder tree. Every file with a one-line description.

**10-environment-variables.md**
Every .env variable, what it does, where to get it, example value. Complete .env.example at the bottom.

---

## The 17 Real Units

| Unit Name       | Type                  | Price/Night | Max Guests | Bedrooms | Bathrooms | Cleaning Fee |
|-----------------|-----------------------|-------------|------------|----------|-----------|--------------|
| Unit One        | Two Bedroom           | $250        | 4          | 2        | 2         | $100         |
| Unit Two        | Two Bedroom           | $250        | 4          | 2        | 2         | $100         |
| Unit Three      | Two Bedroom           | $250        | 4          | 2        | 2         | $100         |
| Unit South      | Two Bedroom           | $250        | 4          | 2        | 2         | $100         |
| Unit Five       | Studio                | $120        | 2          | Studio   | 1         | $65          |
| Unit Six        | Studio                | $120        | 2          | Studio   | 1         | $65          |
| Unit 23-1       | One Bedroom           | $180        | 2          | 1        | 1         | $80          |
| Unit 23-2       | Studio Loft           | $130        | 2          | Studio   | 1         | $65          |
| Unit SW         | One Bedroom           | $180        | 2          | 1        | 1         | $80          |
| Unit NW         | One Bedroom           | $180        | 2          | 1        | 1         | $80          |
| Unit 1A         | One Bedroom           | $180        | 2          | 1        | 1         | $80          |
| Unit 2A         | One Bedroom           | $180        | 2          | 1        | 1         | $80          |
| Unit SE         | Efficiency            | $100        | 2          | Studio   | 1         | $50          |
| Unit NE         | Efficiency            | $100        | 2          | Studio   | 1         | $50          |
| Unit B1         | Efficiency            | $100        | 2          | Studio   | 1         | $50          |
| Unit B2         | Efficiency            | $100        | 2          | Studio   | 1         | $50          |
| Unit 25 Cottage | Cottage / One Bedroom | $180        | 2          | 1        | 1         | $80          |

Each unit has an optional icalUrl field in the database for Airbnb/VRBO calendar sync.

---

## Database Schema (Prisma)

IMPORTANT: User.id is the Clerk userId string (e.g. "user_2abc123...") — NOT a generated UUID.
Do NOT include passwordHash, provider, or any Session model.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id          // Clerk userId — set by frontend on /api/auth/sync
  name      String
  email     String    @unique
  role      Role      @default(GUEST)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bookings  Booking[]
  reviews   Review[]
}

enum Role { GUEST ADMIN }

model Unit {
  id            String        @id @default(uuid())
  slug          String        @unique
  name          String
  type          String
  pricePerNight Decimal       @db.Decimal(10, 2)
  cleaningFee   Decimal       @default(0) @db.Decimal(10, 2)
  maxGuests     Int
  bedrooms      String
  bathrooms     String
  sqft          String
  description   String[]
  images        String[]
  amenities     String[]
  status        UnitStatus    @default(AVAILABLE)
  icalUrl       String?
  icalLastSync  DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  bookings      Booking[]
  blockedDates  BlockedDate[]
  reviews       Review[]
}

enum UnitStatus { AVAILABLE UNAVAILABLE MAINTENANCE }

model Booking {
  id          String        @id @default(uuid())
  user        User          @relation(fields: [userId], references: [id])
  userId      String
  unit        Unit          @relation(fields: [unitId], references: [id])
  unitId      String
  checkin     DateTime
  checkout    DateTime
  guests      Int
  totalPrice  Decimal       @db.Decimal(10, 2)
  status      BookingStatus @default(PENDING)
  reviewed    Boolean       @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  payment     Payment?
  review      Review?
}

enum BookingStatus { PENDING CONFIRMED CANCELLED COMPLETED }

model BlockedDate {
  id        String      @id @default(uuid())
  unit      Unit        @relation(fields: [unitId], references: [id])
  unitId    String
  date      DateTime
  source    BlockSource @default(BOOKING)
  bookingId String?
  note      String?
  createdAt DateTime    @default(now())

  @@unique([unitId, date])
  @@index([unitId, date])
}

enum BlockSource { BOOKING ICAL MANUAL }

model Payment {
  id                  String        @id @default(uuid())
  booking             Booking       @relation(fields: [bookingId], references: [id])
  bookingId           String        @unique
  stripeSessionId     String?       @unique
  stripePaymentIntent String?       @unique
  amount              Decimal       @db.Decimal(10, 2)
  currency            String        @default("usd")
  status              PaymentStatus @default(PENDING)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}

enum PaymentStatus { PENDING PAID REFUNDED FAILED }

model Review {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  unit      Unit     @relation(fields: [unitId], references: [id])
  unitId    String
  booking   Booking  @relation(fields: [bookingId], references: [id])
  bookingId String   @unique
  rating    Int
  content   String
  createdAt DateTime @default(now())
}
```

---

## NestJS Folder Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts       <- POST /api/auth/sync only
│   ├── auth.service.ts          <- upsert user in DB from Clerk data
│   ├── dto/
│   │   └── sync-user.dto.ts     <- { clerkId, name, email }
│   └── guards/
│       ├── clerk.guard.ts       <- verifies Clerk JWT from Authorization header
│       └── admin.guard.ts       <- checks role === ADMIN in PostgreSQL
│
├── units/
│   ├── units.module.ts
│   ├── units.controller.ts
│   ├── units.service.ts
│   ├── units.repository.ts
│   └── dto/
│       ├── create-unit.dto.ts
│       └── update-unit.dto.ts
│
├── availability/
│   ├── availability.module.ts
│   ├── availability.controller.ts
│   └── availability.service.ts
│
├── bookings/
│   ├── bookings.module.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   ├── bookings.repository.ts
│   └── dto/
│       └── create-booking.dto.ts
│
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── dto/
│       └── create-session.dto.ts
│
├── reviews/
│   ├── reviews.module.ts
│   ├── reviews.controller.ts
│   ├── reviews.service.ts
│   ├── reviews.repository.ts
│   └── dto/
│       └── create-review.dto.ts
│
├── ical/
│   ├── ical.module.ts
│   ├── ical.service.ts
│   └── ical.scheduler.ts
│
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
│
├── cloudinary/
│   ├── cloudinary.module.ts
│   └── cloudinary.service.ts
│
├── prisma/
│   └── prisma.service.ts
│
└── main.ts

prisma/
├── schema.prisma
└── seed.ts
```

---

## All API Endpoints

### Auth
| Method | Path             | Auth   | Description                                        |
|--------|------------------|--------|----------------------------------------------------|
| POST   | /api/auth/sync   | Public | Upsert user in DB after Clerk signup. Body: { clerkId, name, email } |

### Units
| Method | Path                  | Auth  | Description                                    |
|--------|-----------------------|-------|------------------------------------------------|
| GET    | /api/units            | Public| List all. Supports ?type=&guests=&checkin=&checkout= |
| GET    | /api/units/:slug      | Public| Get single unit by slug                        |
| POST   | /api/units            | Admin | Create unit                                    |
| PUT    | /api/units/:id        | Admin | Update unit                                    |
| DELETE | /api/units/:id        | Admin | Delete (blocked if active bookings exist)      |
| POST   | /api/units/:id/images | Admin | Upload photos to Cloudinary                    |
| DELETE | /api/units/:id/images | Admin | Remove a photo URL                             |
| PUT    | /api/units/:id/ical   | Admin | Save or update iCal URL                        |

### Availability
| Method | Path                      | Auth   | Description                                                        |
|--------|---------------------------|--------|--------------------------------------------------------------------|
| GET    | /api/availability/:unitId | Public | ?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD -> { available: boolean, blockedDates: string[] } |

### Bookings
| Method | Path                     | Auth         | Description                           |
|--------|--------------------------|--------------|---------------------------------------|
| POST   | /api/bookings            | Clerk        | Create booking (availability checked) |
| GET    | /api/bookings/mine       | Clerk        | Get own booking history               |
| GET    | /api/bookings/:id        | Clerk/Admin  | Get single booking detail             |
| PUT    | /api/bookings/:id/cancel | Clerk        | Cancel own booking (48hr rule)        |
| GET    | /api/bookings            | Admin        | All bookings — ?status=&unitId=&from=&to=&page=&limit= |
| PUT    | /api/bookings/:id/status | Admin        | Change booking status                 |

### Payments
| Method | Path                  | Auth        | Description                               |
|--------|-----------------------|-------------|-------------------------------------------|
| POST   | /api/payments/session | Clerk       | Create Stripe Checkout Session            |
| POST   | /api/payments/webhook | Stripe only | Raw body — verify signature — handle events |

### Reviews
| Method | Path                 | Auth   | Description                          |
|--------|----------------------|--------|--------------------------------------|
| GET    | /api/reviews/:unitId | Public | Get all reviews for a unit           |
| POST   | /api/reviews         | Clerk  | Submit review (eligibility enforced) |
| DELETE | /api/reviews/:id     | Admin  | Delete a review                      |

### iCal
| Method | Path                   | Auth  | Description                            |
|--------|------------------------|-------|----------------------------------------|
| POST   | /api/ical/sync         | Admin | Trigger full sync for all units        |
| POST   | /api/ical/sync/:unitId | Admin | Trigger sync for one specific unit     |
| GET    | /api/ical/status       | Admin | Last sync time and blocked count per unit |

### Admin
| Method | Path                           | Auth  | Description                         |
|--------|--------------------------------|-------|-------------------------------------|
| GET    | /api/admin/stats               | Admin | Dashboard stats                     |
| GET    | /api/admin/users               | Admin | All users — ?search=&role=&page=&limit= |
| GET    | /api/admin/users/:id           | Admin | User profile and booking history    |
| PUT    | /api/admin/users/:id/role      | Admin | Change user role                    |
| DELETE | /api/admin/users/:id           | Admin | Delete user (no active bookings)    |
| GET    | /api/admin/calendar/:unitId    | Admin | All blocked dates for a unit        |
| POST   | /api/admin/block               | Admin | Manually block dates { unitId, dates[], note? } |
| DELETE | /api/admin/block/:id           | Admin | Unblock MANUAL-source dates only    |
| GET    | /api/admin/payments            | Admin | All payments — ?status=&from=&to=&page=&limit= |
| POST   | /api/admin/payments/:id/refund | Admin | Issue Stripe refund                 |
| GET    | /api/admin/checkins/today      | Admin | All check-ins today                 |
| GET    | /api/admin/checkouts/today     | Admin | All check-outs today                |
| GET    | /api/admin/checkins/upcoming   | Admin | Check-ins in the next 7 days        |

---

## main.ts Configuration

```typescript
// No session middleware — Clerk handles auth
app.enableCors({
  origin: [process.env.CUSTOMER_FRONTEND_URL, process.env.ADMIN_FRONTEND_URL],
  credentials: true,
});

app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

// IMPORTANT: Stripe webhook needs raw body — configure before any body parsers
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
```

---

## Business Rules — Service Layer Only, Never Controllers

1. Availability — reject booking if ANY date in checkin-to-checkout range exists in BlockedDate for that unit regardless of source
2. On payment confirmed — Stripe webhook checkout.session.completed -> set booking CONFIRMED -> write every date in range to BlockedDate with source BOOKING
3. Cancellation — only allowed if checkin is more than 48 hours from now -> remove BOOKING-sourced BlockedDate rows for that bookingId only -> never touch ICAL or MANUAL rows
4. Review eligibility — user must have a COMPLETED booking for that unit with reviewed: false
5. Admin role — assigned in PostgreSQL only — no public API to self-promote
6. Pricing formula — totalPrice = (nights x pricePerNight) + cleaningFee + Math.round(nights x pricePerNight x 0.12)
7. Stripe webhook — must call stripe.webhooks.constructEvent(rawBody, signature, secret) — throw 400 if verification fails
8. Admin unblock — can only delete BlockedDate rows where source === MANUAL
9. Unit delete — blocked if unit has any PENDING or CONFIRMED bookings

---

## iCal Sync Logic

```typescript
// Runs every 2 hours automatically
@Cron('0 */2 * * *')
async syncAllUnits() {
  const units = await this.prisma.unit.findMany({ where: { icalUrl: { not: null } } });
  for (const unit of units) { await this.syncUnit(unit.id); }
}

// syncUnit(unitId) steps:
// 1. HTTP GET unit.icalUrl -> raw iCal text
// 2. Parse with node-ical -> extract all VEVENTs
// 3. For each VEVENT -> expand every single date between DTSTART and DTEND
// 4. Upsert each date:
//    where:  { unitId_date: { unitId, date } }
//    create: { unitId, date, source: ICAL }
//    update: {} (empty — never overwrite BOOKING-sourced rows)
// 5. Update unit.icalLastSync = new Date()
```

---

## Admin Dashboard Stats Response

```typescript
{
  totalRevenue:      number,   // all-time sum of confirmed payments
  revenueThisMonth:  number,
  totalBookings:     number,
  bookingsThisMonth: number,
  occupancyRate:     number,   // % of unit-nights booked this month
  upcomingCheckins:  number,   // next 7 days
  upcomingCheckouts: number,   // next 7 days
  totalGuests:       number,
  totalUnits:        number,
  unitsSummary: Array<{
    unitId:        string,
    unitName:      string,
    status:        string,
    nextCheckin:   string | null,
    nextCheckout:  string | null,
    totalBookings: number
  }>
}
```

---

## Seed Data (prisma/seed.ts)

Create:
- All 17 units with correct slugs (unit-one, unit-two, unit-south, unit-five, unit-six, unit-23-1, unit-23-2, unit-sw, unit-nw, unit-1a, unit-2a, unit-se, unit-ne, unit-b1, unit-b2, unit-25-cottage, unit-three), names, types, prices, cleaning fees, maxGuests, bedrooms, bathrooms. Set icalUrl to null for all.
- NOTE: Do NOT seed users — users are created dynamically via /api/auth/sync when they first sign in through Clerk.
- To make a user admin after signup: run a direct SQL update or a one-time migration script.

---

## Environment Variables (.env.example)

```
# App
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pbpointe

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Frontend Origins
CUSTOMER_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Build Order (After Docs Approved)

```
Step 1  — NestJS project scaffold + Prisma setup + .env config
Step 2  — PrismaService as global shared module
Step 3  — main.ts: CORS + ValidationPipe + raw body for Stripe webhook
Step 4  — Auth module: ClerkGuard, AdminGuard, POST /api/auth/sync only
Step 5  — Units module: CRUD + slug generation + seed script
Step 6  — Availability module: date range conflict checker against BlockedDate
Step 7  — Bookings module: create, mine, cancel (48hr rule enforced)
Step 8  — Payments module: Stripe session creation + webhook handler
Step 9  — iCal module: fetch + parse + upsert BlockedDates + cron every 2hrs
Step 10 — Cloudinary module: image upload service
Step 11 — Reviews module: create (eligibility check), list by unit, delete
Step 12 — Admin module: stats, users, calendar management, manual block/unblock, refunds, check-in lists
```

---

## Final Instruction

**Start with Step Zero only.**

Create the /docs folder and write all 10 documentation files with full detail and Mermaid diagrams where applicable. Do not create any source code files. Do not scaffold the NestJS project. Do not install any packages. Do not run any commands.

Only create the docs/ folder and its 10 markdown files.

When all 10 files are complete, tell me "Documentation is ready for your review" and STOP. Wait for me to say "proceed" before writing any code.
