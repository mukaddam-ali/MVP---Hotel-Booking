# 01 — System Architecture

## High-Level Overview

```mermaid
graph TB
    subgraph "Customer Side"
        CF["Customer Frontend\nNext.js + Clerk\npbpointe.com"]
        Guest["Guest / User"]
    end

    subgraph "Admin Side"
        AF["Admin Frontend\nNext.js + Clerk\nadmin.pbpointe.com"]
        Admin["Admin User"]
    end

    subgraph "Auth (External)"
        Clerk["Clerk\nclerk.com\nJWT Issuer"]
    end

    subgraph "Backend (This Repo)"
        API["NestJS REST API\napi.pbpointe.com"]
        CG["ClerkGuard\nVerify JWT"]
        AG["AdminGuard\nCheck DB Role"]
    end

    subgraph "Database"
        PG["PostgreSQL\n(via Prisma)"]
    end

    subgraph "External Services"
        Stripe["Stripe\nPayments"]
        Cloud["Cloudinary\nFile Storage"]
        iCal["Airbnb / VRBO\niCal Feeds"]
    end

    Guest --> CF
    Admin --> AF
    CF --> Clerk
    AF --> Clerk
    Clerk -->|"Signed JWT"| CF
    Clerk -->|"Signed JWT"| AF
    CF -->|"Authorization: Bearer token"| API
    AF -->|"Authorization: Bearer token"| API
    API --> CG --> AG
    API --> PG
    API --> Stripe
    API --> Cloud
    API -->|"HTTP GET every 2hrs"| iCal
```

---

## JWT Flow — How Authentication Works

```mermaid
sequenceDiagram
    participant G as Guest/Admin
    participant FE as Frontend (Next.js)
    participant Clerk as Clerk (External)
    participant API as NestJS API
    participant DB as PostgreSQL

    G->>FE: Clicks "Sign In"
    FE->>Clerk: Clerk UI handles login
    Clerk-->>FE: Returns signed JWT (session token)
    FE->>API: GET /api/units\nAuthorization: Bearer <jwt>
    API->>Clerk: verifyToken(jwt, CLERK_SECRET_KEY)
    Clerk-->>API: { sub: "user_2abc...", ... }
    API->>DB: findUnique({ where: { id: "user_2abc..." } })
    DB-->>API: User record (with role)
    API-->>FE: 200 OK + data
```

---

## Layer Explanations

### Layer 1 — Customer Frontend (pbpointe.com)
- Built with Next.js and Clerk's React components (`@clerk/nextjs`)
- Handles all UI: unit browsing, availability search, booking creation, Stripe redirect, review submission
- Never touches raw passwords or sessions — Clerk manages this entirely
- On every protected request, sends the Clerk JWT as `Authorization: Bearer <token>`

### Layer 2 — Admin Frontend (admin.pbpointe.com)
- Separate Next.js app, also using Clerk for login
- On load, calls `POST /api/auth/sync` to verify the user is in the DB with `role = ADMIN`
- If the backend returns 403, the frontend shows "Access Denied"
- Provides UI for: unit management, booking oversight, manual calendar blocking, gallery/testimonial management, refunds, dashboard stats

### Layer 3 — NestJS Backend (api.pbpointe.com)
The core of this repository. Responsibilities:
- Receive and verify Clerk JWTs via `ClerkGuard`
- Enforce role-based access via `AdminGuard` (checks PostgreSQL, not Clerk)
- Execute all business logic (availability checks, pricing, booking state machine, cancellation rules)
- Orchestrate external services (Stripe, Cloudinary, iCal)
- Run scheduled tasks (iCal sync every 2 hours)

### Layer 4 — PostgreSQL (via Prisma)
- Single source of truth for all application data
- Roles are stored here — Clerk knows nothing about GUEST/ADMIN roles
- `User.id` is the Clerk userId string (e.g. `user_2abc123`) — not a UUID
- `BlockedDate` table serves as the unified calendar — all sources (BOOKING, ICAL, MANUAL) write here

### Layer 5 — External Services

| Service | Purpose | Integration Point |
|---|---|---|
| **Clerk** | Authentication, user sessions, JWT issuance | `@clerk/backend` → `verifyToken()` in ClerkGuard |
| **Stripe** | Payment processing, refunds | `stripe` npm package; webhook at `POST /api/payments/webhook` |
| **Cloudinary** | Image hosting and CDN delivery | `cloudinary` npm package; used in Units and Gallery modules |
| **Airbnb/VRBO** | External calendar feeds (iCal format) | `node-ical` fetches and parses; cron runs every 2 hours |

---

## Design Decisions

### Why Clerk instead of custom auth?
Building auth from scratch (sessions, password hashing, email verification, OAuth) adds weeks of work and significant security risk. Clerk handles all of this as a managed service, letting the backend focus entirely on booking domain logic.

### Why separate AdminGuard from ClerkGuard?
Clerk only knows if a user is authenticated (valid session). It knows nothing about our application's GUEST/ADMIN distinction. Separating the two guards keeps concerns clean:
- `ClerkGuard` → "Is this a valid logged-in user?" (Clerk's job)
- `AdminGuard` → "Is this user an admin in OUR system?" (our DB's job)

### Why a unified BlockedDate table?
Rather than having separate "booked dates," "iCal blocked dates," and "manual blocked dates" tables, all blocked dates share one table with a `source` enum (`BOOKING | ICAL | MANUAL`). This makes the availability check trivially simple: query one table, get all blocked dates. The source field controls what admin operations are allowed on each row.

### Why raw body for Stripe webhook?
Stripe signs its webhook payloads. The signature is computed over the raw request body bytes. Once Express/NestJS parses the body into a JSON object, the raw bytes are lost and signature verification fails. The raw body middleware must be registered before any JSON body parsers.
