# 02 — Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    User {
        String id PK "Clerk userId"
        String name
        String email UK
        Role role
        DateTime createdAt
        DateTime updatedAt
    }

    Unit {
        String id PK "uuid"
        String slug UK
        String name
        String type
        Decimal pricePerNight
        Decimal cleaningFee
        Int maxGuests
        String bedrooms
        String bathrooms
        String sqft
        String[] description
        String[] images
        String[] amenities
        UnitStatus status
        String icalUrl "nullable"
        DateTime icalLastSync "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    Booking {
        String id PK "uuid"
        String userId FK
        String unitId FK
        DateTime checkin
        DateTime checkout
        Int guests
        Decimal totalPrice
        BookingStatus status
        Boolean reviewed
        DateTime createdAt
        DateTime updatedAt
    }

    BlockedDate {
        String id PK "uuid"
        String unitId FK
        DateTime date
        BlockSource source
        String bookingId "nullable"
        String note "nullable"
        DateTime createdAt
    }

    Payment {
        String id PK "uuid"
        String bookingId FK UK
        String stripeSessionId UK "nullable"
        String stripePaymentIntent UK "nullable"
        Decimal amount
        String currency
        PaymentStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    Review {
        String id PK "uuid"
        String userId FK
        String unitId FK
        String bookingId FK UK
        Int rating
        String content
        Boolean featured
        DateTime createdAt
    }

    Testimonial {
        String id PK "uuid"
        String guestName
        String location "nullable"
        String content
        Int rating "nullable"
        String imageUrl "nullable"
        Int order
        DateTime createdAt
        DateTime updatedAt
    }

    GalleryImage {
        String id PK "uuid"
        String url
        String caption "nullable"
        Int order
        String unitId FK "nullable"
        DateTime createdAt
    }

    User ||--o{ Booking : "has"
    User ||--o{ Review : "writes"
    Unit ||--o{ Booking : "has"
    Unit ||--o{ BlockedDate : "has"
    Unit ||--o{ Review : "has"
    Unit ||--o{ GalleryImage : "has (optional)"
    Booking ||--o| Payment : "has"
    Booking ||--o| Review : "has"
```

---

## Full Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── User ───────────────────────────────────────────────────────────────────

model User {
  id        String    @id          // Clerk userId — NOT a generated UUID
  name      String
  email     String    @unique
  role      Role      @default(GUEST)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bookings  Booking[]
  reviews   Review[]
}

enum Role {
  GUEST
  ADMIN
}

// ─── Unit ───────────────────────────────────────────────────────────────────

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
  galleryImages GalleryImage[]
}

enum UnitStatus {
  AVAILABLE
  UNAVAILABLE
  MAINTENANCE
}

// ─── Booking ─────────────────────────────────────────────────────────────────

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

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

// ─── BlockedDate ─────────────────────────────────────────────────────────────

model BlockedDate {
  id        String      @id @default(uuid())
  unit      Unit        @relation(fields: [unitId], references: [id])
  unitId    String
  date      DateTime
  source    BlockSource @default(BOOKING)
  bookingId String?     // populated for BOOKING source only
  note      String?     // populated for MANUAL source only
  createdAt DateTime    @default(now())

  @@unique([unitId, date])
  @@index([unitId, date])
}

enum BlockSource {
  BOOKING   // Created when payment confirmed
  ICAL      // Created by iCal sync from Airbnb/VRBO
  MANUAL    // Created by admin manually
}

// ─── Payment ─────────────────────────────────────────────────────────────────

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

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  FAILED
}

// ─── Review ──────────────────────────────────────────────────────────────────

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
  featured  Boolean  @default(false)  // admin can pin as testimonial
  createdAt DateTime @default(now())
}

// ─── Testimonial ─────────────────────────────────────────────────────────────

model Testimonial {
  id        String   @id @default(uuid())
  guestName String
  location  String?
  content   String
  rating    Int?
  imageUrl  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── GalleryImage ─────────────────────────────────────────────────────────────

model GalleryImage {
  id        String   @id @default(uuid())
  url       String
  caption   String?
  order     Int      @default(0)
  unit      Unit?    @relation(fields: [unitId], references: [id])
  unitId    String?  // null = property-wide; set = unit-specific
  createdAt DateTime @default(now())
}
```

---

## Model Explanations

### User
- `id` is the **Clerk userId** (e.g. `user_2abc123xyz`) — this is a string set by the frontend when calling `POST /api/auth/sync` after Clerk signup. It is NOT a database-generated UUID.
- No `passwordHash`, no `provider`, no `Session` model — Clerk owns authentication entirely.
- `role` defaults to `GUEST`. To make someone admin, run: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@pbpointe.com';`

### Unit
- `slug` is URL-friendly identifier used in frontend routes (e.g. `/units/unit-one`)
- `description`, `images`, `amenities` are PostgreSQL string arrays — flexible, no join tables needed
- `icalUrl` stores the Airbnb/VRBO iCal feed URL per unit (can be null if unit isn't listed on OTAs)
- `icalLastSync` tracks when the last automated sync ran

### Booking
- `status` follows a state machine: `PENDING → CONFIRMED → COMPLETED` or `PENDING/CONFIRMED → CANCELLED`
- `reviewed` starts as `false`; set to `true` when the guest submits a review (prevents duplicate reviews)
- `totalPrice` is computed at booking creation time: `(nights × pricePerNight) + cleaningFee + 12% service fee`

### BlockedDate
- The **unified availability calendar**. Every blocked date from every source lands here.
- `@@unique([unitId, date])` — a unit can only have one BlockedDate record per calendar day
- `source` controls business logic:
  - `BOOKING` — written when Stripe payment confirms; removed on cancellation for that bookingId only
  - `ICAL` — written by the cron job from Airbnb/VRBO feeds; never overwritten by the upsert update clause
  - `MANUAL` — written by admin; only MANUAL rows can be deleted via the admin unblock API
- `bookingId` is only populated for `BOOKING` source rows (used when cancelling to delete the right rows)
- `note` is only populated for `MANUAL` source rows (admin's reason for blocking)

### Payment
- One `Payment` per `Booking` (1-to-1, `bookingId` is unique)
- `stripeSessionId` — the Stripe Checkout Session ID, used to match webhook events
- `stripePaymentIntent` — populated after the session completes, used for refunds
- `status` mirrors Stripe state: `PENDING → PAID → REFUNDED` or `FAILED`

### Review
- One review per booking (`bookingId` is unique) — prevents duplicate reviews
- `featured` flag allows admin to pin a real guest review to appear in the public testimonials feed alongside manually entered Testimonials
- Eligibility enforced in service: booking must have `status = COMPLETED` and `reviewed = false`

### Testimonial
- Admin-authored testimonials, separate from the Review system
- `order` field controls display sequence on the frontend
- `imageUrl` is optional — admin can optionally add a guest photo

### GalleryImage
- `unitId` is optional: `null` = property-wide photo (shown on homepage gallery), a UUID = unit-specific photo
- `order` controls display sequence
- Images are uploaded to Cloudinary; only the CDN URL is stored here
