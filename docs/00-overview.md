# 00 — Project Overview

## Project Name

**Pompano Beach Pointe Residences — Direct Booking System**

---

## Business Context

Pompano Beach Pointe Residences is a short-term rental property in Pompano Beach, Florida with 17 real rental units ranging from Efficiency studios to Two-Bedroom apartments.

### Problem Being Solved

The property is currently listed on **Airbnb** and **VRBO**. These Online Travel Agencies (OTAs) charge service fees on every booking — both to the guest (typically 12–15%) and to the host (3–5%). By operating a direct booking website, the property can:

- Eliminate OTA service fees entirely
- Build a direct relationship with guests
- Control pricing, availability, and cancellation policies
- Capture guest contact information for marketing

### Solution

A direct booking website at **pbpointe.com** where guests can search availability, view units, and complete the full booking + payment flow without touching Airbnb or VRBO. The property's existing OTA listings remain active, and their calendars are synced every 2 hours via iCal to prevent double bookings.

---

## Full Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Customer Frontend | Next.js + Clerk | pbpointe.com |
| Admin Frontend | Next.js + Clerk | admin.pbpointe.com |
| Backend API | NestJS (TypeScript) | api.pbpointe.com |
| Database | PostgreSQL | Hosted on Railway or Supabase |
| ORM | Prisma | Type-safe DB access |
| Authentication | Clerk (@clerk/backend) | JWT-based, no sessions |
| Payments | Stripe | Checkout Sessions + Webhooks |
| File Storage | Cloudinary | Unit photos + gallery images |
| iCal Sync | node-ical | Airbnb/VRBO calendar feed parsing |
| Task Scheduling | @nestjs/schedule | Cron job every 2 hours |
| Validation | class-validator + class-transformer | DTO validation |
| API Style | REST | JSON over HTTP |

---

## Two-Frontend Architecture

```
Customer Frontend (Next.js)          Admin Frontend (Next.js)
pbpointe.com                         admin.pbpointe.com
        |                                    |
        |   Bearer <clerk-token>             |   Bearer <clerk-token>
        +------------------+-----------------+
                           |
                    NestJS Backend
                    api.pbpointe.com
                    (This repository)
```

- **Customer Frontend** — Public-facing booking site. Guests browse units, check availability, create bookings, pay via Stripe, leave reviews.
- **Admin Frontend** — Internal dashboard. Admins manage units, view bookings, handle refunds, manage blocked dates, view stats, manage gallery and testimonials.
- **NestJS Backend** — Single REST API serving both frontends. All business logic lives here. Authentication is delegated to Clerk; the backend only verifies Clerk-issued JWTs.

---

## Deployment Targets

| Service | URL |
|---|---|
| Customer Frontend | pbpointe.com |
| Admin Frontend | admin.pbpointe.com |
| NestJS API | api.pbpointe.com |
| PostgreSQL | Railway / Supabase |
| Cloudinary | cloudinary.com (CDN delivery) |

---

## The 17 Real Units

| Unit Name | Type | Price/Night | Cleaning Fee | Max Guests | Bedrooms | Bathrooms |
|---|---|---|---|---|---|---|
| Unit One | Two Bedroom | $250 | $100 | 4 | 2 | 2 |
| Unit Two | Two Bedroom | $250 | $100 | 4 | 2 | 2 |
| Unit Three | Two Bedroom | $250 | $100 | 4 | 2 | 2 |
| Unit South | Two Bedroom | $250 | $100 | 4 | 2 | 2 |
| Unit Five | Studio | $120 | $65 | 2 | Studio | 1 |
| Unit Six | Studio | $120 | $65 | 2 | Studio | 1 |
| Unit 23-1 | One Bedroom | $180 | $80 | 2 | 1 | 1 |
| Unit 23-2 | Studio Loft | $130 | $65 | 2 | Studio | 1 |
| Unit SW | One Bedroom | $180 | $80 | 2 | 1 | 1 |
| Unit NW | One Bedroom | $180 | $80 | 2 | 1 | 1 |
| Unit 1A | One Bedroom | $180 | $80 | 2 | 1 | 1 |
| Unit 2A | One Bedroom | $180 | $80 | 2 | 1 | 1 |
| Unit SE | Efficiency | $100 | $50 | 2 | Studio | 1 |
| Unit NE | Efficiency | $100 | $50 | 2 | Studio | 1 |
| Unit B1 | Efficiency | $100 | $50 | 2 | Studio | 1 |
| Unit B2 | Efficiency | $100 | $50 | 2 | Studio | 1 |
| Unit 25 Cottage | Cottage / One Bedroom | $180 | $80 | 2 | 1 | 1 |

**Slug mapping (used in URLs and DB):**
`unit-one`, `unit-two`, `unit-three`, `unit-south`, `unit-five`, `unit-six`, `unit-23-1`, `unit-23-2`, `unit-sw`, `unit-nw`, `unit-1a`, `unit-2a`, `unit-se`, `unit-ne`, `unit-b1`, `unit-b2`, `unit-25-cottage`
