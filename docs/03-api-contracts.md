# 03 — API Contracts

**Base URL:** `https://api.pbpointe.com/api`

**Auth levels:**
- `Public` — No token required
- `Clerk` — Valid Clerk JWT required (`Authorization: Bearer <token>`)
- `Admin` — Clerk JWT required AND `user.role === ADMIN` in PostgreSQL
- `Stripe` — Raw body with Stripe signature header (no Clerk token)

---

## Auth

### POST /api/auth/sync
Called by frontend immediately after Clerk signup. Upserts user into PostgreSQL.

**Auth:** Public

**Request body:**
```typescript
{
  clerkId: string   // Clerk userId (e.g. "user_2abc123")
  name:    string
  email:   string
}
```

**Response 200:**
```typescript
{
  id:    string   // same as clerkId
  name:  string
  email: string
  role:  "GUEST" | "ADMIN"
}
```

**Errors:** `400` invalid body

---

## Units

### GET /api/units
List all units. Supports optional filtering.

**Auth:** Public

**Query params:**
```
?type=Studio|One+Bedroom|Two+Bedroom|Efficiency|Studio+Loft|Cottage+%2F+One+Bedroom
&guests=2
&checkin=YYYY-MM-DD
&checkout=YYYY-MM-DD
```
When `checkin` + `checkout` are provided, only units with no BlockedDate conflicts in that range are returned.

**Response 200:**
```typescript
Array<{
  id:            string
  slug:          string
  name:          string
  type:          string
  pricePerNight: number
  cleaningFee:   number
  maxGuests:     number
  bedrooms:      string
  bathrooms:     string
  sqft:          string
  description:   string[]
  images:        string[]
  amenities:     string[]
  status:        "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE"
  averageRating: number | null
  reviewCount:   number
}>
```

---

### GET /api/units/:slug
Get a single unit by slug.

**Auth:** Public

**Response 200:**
```typescript
{
  id:            string
  slug:          string
  name:          string
  type:          string
  pricePerNight: number
  cleaningFee:   number
  maxGuests:     number
  bedrooms:      string
  bathrooms:     string
  sqft:          string
  description:   string[]
  images:        string[]
  amenities:     string[]
  status:        "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE"
  averageRating: number | null
  reviewCount:   number
}
```

**Errors:** `404` unit not found

---

### POST /api/units
Create a new unit.

**Auth:** Admin

**Request body:**
```typescript
{
  name:          string
  type:          string
  pricePerNight: number
  cleaningFee:   number
  maxGuests:     number
  bedrooms:      string
  bathrooms:     string
  sqft:          string
  description:   string[]
  amenities:     string[]
  status?:       "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE"  // default: AVAILABLE
  icalUrl?:      string
}
```
Slug is auto-generated from name (kebab-case).

**Response 201:** Full unit object (same shape as GET /api/units/:slug)

**Errors:** `400` validation, `409` slug already exists

---

### PUT /api/units/:id
Update a unit's details.

**Auth:** Admin

**Request body (all fields optional):**
```typescript
{
  name?:          string
  type?:          string
  pricePerNight?: number
  cleaningFee?:   number
  maxGuests?:     number
  bedrooms?:      string
  bathrooms?:     string
  sqft?:          string
  description?:   string[]
  amenities?:     string[]
  status?:        "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE"
}
```

**Response 200:** Updated unit object

**Errors:** `400` validation, `404` not found

---

### DELETE /api/units/:id
Delete a unit. Blocked if the unit has any PENDING or CONFIRMED bookings.

**Auth:** Admin

**Response 200:** `{ message: "Unit deleted" }`

**Errors:** `404` not found, `409` has active bookings

---

### POST /api/units/:id/images
Upload one or more photos. Multipart form-data. Uploads to Cloudinary and appends URLs to `unit.images`.

**Auth:** Admin

**Request:** `multipart/form-data` — field name `files`, multiple files allowed

**Response 200:**
```typescript
{ images: string[] }  // full updated images array
```

**Errors:** `404` unit not found, `400` no files

---

### DELETE /api/units/:id/images
Remove a specific image URL from the unit's images array.

**Auth:** Admin

**Request body:**
```typescript
{ url: string }
```

**Response 200:**
```typescript
{ images: string[] }  // updated images array
```

**Errors:** `404` not found, `400` url not in array

---

### PUT /api/units/:id/ical
Save or update the iCal feed URL for a unit.

**Auth:** Admin

**Request body:**
```typescript
{ icalUrl: string }
```

**Response 200:**
```typescript
{ id: string, icalUrl: string }
```

---

## Availability

### GET /api/availability/:unitId
Check if a unit is available for a date range and return all currently blocked dates.

**Auth:** Public

**Query params:**
```
?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD
```

**Response 200:**
```typescript
{
  available:    boolean
  blockedDates: string[]   // ISO date strings in the queried range
  priceSummary: {
    nights:      number
    basePrice:   number    // nights × pricePerNight
    cleaningFee: number
    serviceFee:  number    // Math.round(nights × pricePerNight × 0.12)
    totalPrice:  number
  }
}
```

**Errors:** `404` unit not found, `400` missing/invalid dates

---

## Bookings

### POST /api/bookings
Create a new booking. Availability is checked atomically before creation.

**Auth:** Clerk

**Request body:**
```typescript
{
  unitId:   string
  checkin:  string   // YYYY-MM-DD
  checkout: string   // YYYY-MM-DD
  guests:   number
}
```

**Response 201:**
```typescript
{
  id:         string
  unitId:     string
  checkin:    string
  checkout:   string
  guests:     number
  totalPrice: number
  status:     "PENDING"
}
```

**Errors:** `400` validation, `404` unit not found, `409` dates not available

---

### GET /api/bookings/mine
Get the authenticated user's own booking history.

**Auth:** Clerk

**Query params:**
```
?status=PENDING|CONFIRMED|CANCELLED|COMPLETED
&page=1&limit=10
```

**Response 200:**
```typescript
{
  data: Array<{
    id:         string
    unit:       { id: string, name: string, slug: string, images: string[] }
    checkin:    string
    checkout:   string
    guests:     number
    totalPrice: number
    status:     string
    reviewed:   boolean
    createdAt:  string
  }>
  total:    number
  page:     number
  lastPage: number
}
```

---

### GET /api/bookings/:id
Get a single booking. Clerks can only fetch their own; admin can fetch any.

**Auth:** Clerk / Admin

**Response 200:**
```typescript
{
  id:         string
  unit:       { id: string, name: string, slug: string, images: string[] }
  user:       { id: string, name: string, email: string }
  checkin:    string
  checkout:   string
  guests:     number
  totalPrice: number
  status:     string
  reviewed:   boolean
  payment:    { status: string, stripeSessionId: string | null } | null
  createdAt:  string
}
```

**Errors:** `404` not found, `403` not owner

---

### PUT /api/bookings/:id/cancel
Cancel a booking. Only allowed if checkin is more than 48 hours from now.

**Auth:** Clerk (own booking only)

**Response 200:**
```typescript
{ id: string, status: "CANCELLED" }
```

**Errors:** `403` not owner, `404` not found, `409` within 48hr window or already cancelled

---

### GET /api/bookings
List all bookings (admin view).

**Auth:** Admin

**Query params:**
```
?status=PENDING|CONFIRMED|CANCELLED|COMPLETED
&unitId=<uuid>
&from=YYYY-MM-DD
&to=YYYY-MM-DD
&page=1&limit=20
```

**Response 200:**
```typescript
{
  data: Array<{
    id:         string
    unit:       { id: string, name: string }
    user:       { id: string, name: string, email: string }
    checkin:    string
    checkout:   string
    guests:     number
    totalPrice: number
    status:     string
    createdAt:  string
  }>
  total:    number
  page:     number
  lastPage: number
}
```

---

### PUT /api/bookings/:id/status
Admin changes booking status.

**Auth:** Admin

**Request body:**
```typescript
{ status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" }
```

**Response 200:**
```typescript
{ id: string, status: string }
```

---

## Payments

### POST /api/payments/session
Create a Stripe Checkout Session for a booking.

**Auth:** Clerk

**Request body:**
```typescript
{
  bookingId:  string
  successUrl: string   // frontend redirect on payment success
  cancelUrl:  string   // frontend redirect on payment cancel
}
```

**Response 201:**
```typescript
{
  sessionId: string   // Stripe Checkout Session ID
  url:       string   // Stripe-hosted checkout page URL
}
```

**Errors:** `404` booking not found, `403` not owner, `409` booking not in PENDING status

---

### POST /api/payments/webhook
Stripe webhook receiver. Must receive raw body. Verifies Stripe signature.

**Auth:** Stripe (signature header `stripe-signature`)

**Handles events:**
- `checkout.session.completed` → sets booking to CONFIRMED, writes BlockedDates, sets payment to PAID
- `payment_intent.payment_failed` → sets payment to FAILED

**Response 200:** `{ received: true }`

**Errors:** `400` invalid signature or missing body

---

## Reviews

### GET /api/reviews/:unitId
Get all published reviews for a unit.

**Auth:** Public

**Response 200:**
```typescript
Array<{
  id:        string
  userId:    string
  userName:  string
  rating:    number
  content:   string
  featured:  boolean
  createdAt: string
}>
```

---

### POST /api/reviews
Submit a review. User must have a COMPLETED booking for that unit with `reviewed = false`.

**Auth:** Clerk

**Request body:**
```typescript
{
  unitId:    string
  bookingId: string
  rating:    number   // 1–5
  content:   string
}
```

**Response 201:**
```typescript
{
  id:        string
  unitId:    string
  rating:    number
  content:   string
  createdAt: string
}
```

**Errors:** `403` no eligible booking, `409` already reviewed, `400` validation

---

### DELETE /api/reviews/:id
Delete a review.

**Auth:** Admin

**Response 200:** `{ message: "Review deleted" }`

**Errors:** `404` not found

---

## iCal

### POST /api/ical/sync
Trigger a full iCal sync for all units that have an icalUrl.

**Auth:** Admin

**Response 200:**
```typescript
{
  synced: number    // units processed
  errors: Array<{ unitId: string, error: string }>
}
```

---

### POST /api/ical/sync/:unitId
Trigger sync for one unit.

**Auth:** Admin

**Response 200:**
```typescript
{
  unitId:       string
  datesBlocked: number
  syncedAt:     string
}
```

**Errors:** `404` unit not found, `400` no icalUrl configured

---

### GET /api/ical/status
Get last sync time and blocked date count per unit.

**Auth:** Admin

**Response 200:**
```typescript
Array<{
  unitId:        string
  unitName:      string
  icalUrl:       string | null
  icalLastSync:  string | null
  icalBlockedCount: number
}>
```

---

## Admin

### GET /api/admin/stats
Dashboard summary statistics.

**Auth:** Admin

**Response 200:**
```typescript
{
  totalRevenue:      number
  revenueThisMonth:  number
  totalBookings:     number
  bookingsThisMonth: number
  occupancyRate:     number    // % of unit-nights booked this month
  upcomingCheckins:  number    // next 7 days
  upcomingCheckouts: number    // next 7 days
  totalGuests:       number
  totalUnits:        number
  unitsSummary: Array<{
    unitId:        string
    unitName:      string
    status:        string
    nextCheckin:   string | null
    nextCheckout:  string | null
    totalBookings: number
  }>
}
```

---

### GET /api/admin/users
List all users.

**Auth:** Admin

**Query params:** `?search=&role=GUEST|ADMIN&page=1&limit=20`

**Response 200:**
```typescript
{
  data: Array<{
    id:           string
    name:         string
    email:        string
    role:         string
    bookingCount: number
    createdAt:    string
  }>
  total:    number
  page:     number
  lastPage: number
}
```

---

### GET /api/admin/users/:id
Get user profile and booking history.

**Auth:** Admin

**Response 200:**
```typescript
{
  id:       string
  name:     string
  email:    string
  role:     string
  bookings: Array<{ id: string, unitName: string, checkin: string, checkout: string, status: string, totalPrice: number }>
}
```

---

### PUT /api/admin/users/:id/role
Change a user's role.

**Auth:** Admin

**Request body:**
```typescript
{ role: "GUEST" | "ADMIN" }
```

**Response 200:** `{ id: string, role: string }`

---

### DELETE /api/admin/users/:id
Delete a user. Blocked if user has active (PENDING or CONFIRMED) bookings.

**Auth:** Admin

**Response 200:** `{ message: "User deleted" }`

**Errors:** `409` has active bookings

---

### GET /api/admin/calendar/:unitId
Get all blocked dates for a unit (all sources).

**Auth:** Admin

**Response 200:**
```typescript
Array<{
  id:        string
  date:      string
  source:    "BOOKING" | "ICAL" | "MANUAL"
  bookingId: string | null
  note:      string | null
}>
```

---

### POST /api/admin/block
Manually block one or more dates for a unit.

**Auth:** Admin

**Request body:**
```typescript
{
  unitId: string
  dates:  string[]   // YYYY-MM-DD array
  note?:  string
}
```

**Response 201:**
```typescript
{ blocked: number }
```

---

### DELETE /api/admin/block/:id
Unblock a date. Only works on MANUAL-source BlockedDate rows.

**Auth:** Admin

**Response 200:** `{ message: "Date unblocked" }`

**Errors:** `404` not found, `403` source is not MANUAL

---

### GET /api/admin/payments
List all payments.

**Auth:** Admin

**Query params:** `?status=PENDING|PAID|REFUNDED|FAILED&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20`

**Response 200:**
```typescript
{
  data: Array<{
    id:                  string
    bookingId:           string
    unitName:            string
    guestName:           string
    amount:              number
    status:              string
    stripePaymentIntent: string | null
    createdAt:           string
  }>
  total:    number
  page:     number
  lastPage: number
}
```

---

### POST /api/admin/payments/:id/refund
Issue a full Stripe refund. Sets payment to REFUNDED and booking to CANCELLED.

**Auth:** Admin

**Response 200:**
```typescript
{ paymentId: string, refundId: string, status: "REFUNDED" }
```

**Errors:** `404` payment not found, `409` already refunded or not paid

---

### GET /api/admin/checkins/today
All check-ins happening today.

**Auth:** Admin

**Response 200:**
```typescript
Array<{
  bookingId: string
  unitName:  string
  guestName: string
  guests:    number
  checkin:   string
}>
```

---

### GET /api/admin/checkouts/today
All check-outs happening today.

**Auth:** Admin

**Response 200:** Same shape as checkins/today but checkout date.

---

### GET /api/admin/checkins/upcoming
All check-ins in the next 7 days.

**Auth:** Admin

**Response 200:** Same shape as checkins/today with additional `daysUntil: number` field.

---

## Testimonials

### GET /api/testimonials
Public list — returns both manual Testimonials and featured Reviews merged and ordered.

**Auth:** Public

**Response 200:**
```typescript
Array<{
  id:        string
  source:    "MANUAL" | "REVIEW"   // which table it came from
  guestName: string
  location:  string | null
  content:   string
  rating:    number | null
  imageUrl:  string | null
  order:     number
  createdAt: string
}>
```

---

### POST /api/admin/testimonials
Create a manual testimonial.

**Auth:** Admin

**Request body:**
```typescript
{
  guestName: string
  location?: string
  content:   string
  rating?:   number   // 1–5
  imageUrl?: string
  order?:    number
}
```

**Response 201:** Testimonial object

---

### PUT /api/admin/testimonials/:id
Edit a manual testimonial.

**Auth:** Admin

**Request body (all fields optional):**
```typescript
{
  guestName?: string
  location?:  string
  content?:   string
  rating?:    number
  imageUrl?:  string
  order?:     number
}
```

**Response 200:** Updated testimonial object

---

### DELETE /api/admin/testimonials/:id
Delete a manual testimonial.

**Auth:** Admin

**Response 200:** `{ message: "Testimonial deleted" }`

---

### PUT /api/admin/reviews/:id/feature
Toggle the `featured` flag on a guest review (pins it as a testimonial on the public page).

**Auth:** Admin

**Request body:**
```typescript
{ featured: boolean }
```

**Response 200:**
```typescript
{ id: string, featured: boolean }
```

---

## Gallery

### GET /api/gallery
List all gallery images. Optionally filter by unit.

**Auth:** Public

**Query params:** `?unitId=<uuid>` (omit for property-wide images only; use `all` to get everything)

**Response 200:**
```typescript
Array<{
  id:       string
  url:      string
  caption:  string | null
  order:    number
  unitId:   string | null
  unitName: string | null
}>
```

---

### POST /api/admin/gallery
Upload an image to Cloudinary and save to gallery.

**Auth:** Admin

**Request:** `multipart/form-data` — field `file` (single image), optional `caption`, optional `unitId`, optional `order`

**Response 201:** GalleryImage object

---

### PUT /api/admin/gallery/:id
Edit gallery image metadata.

**Auth:** Admin

**Request body (all optional):**
```typescript
{
  caption?: string
  order?:   number
  unitId?:  string | null   // null = move to property-wide
}
```

**Response 200:** Updated GalleryImage object

---

### DELETE /api/admin/gallery/:id
Remove image from Cloudinary and delete DB record.

**Auth:** Admin

**Response 200:** `{ message: "Image deleted" }`

**Errors:** `404` not found
