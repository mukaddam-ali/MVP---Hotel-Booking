# 06 — Payment Flow

## Overview

Payments are processed entirely through **Stripe Checkout**. The backend never handles card details — Stripe hosts the payment page. The backend creates a Checkout Session, redirects the guest to Stripe, and then receives a signed webhook event from Stripe to confirm the result.

---

## Stripe Checkout Session Creation

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as NestJS API
    participant Stripe as Stripe API
    participant DB as PostgreSQL

    FE->>API: POST /api/payments/session\n{ bookingId, successUrl, cancelUrl }
    API->>DB: Find booking (verify owner, verify PENDING status)
    DB-->>API: Booking { id, totalPrice, unit.name, userId }
    API->>Stripe: stripe.checkout.sessions.create({\n  line_items: [{ price_data: { unit_amount: totalPrice×100 } }],\n  metadata: { bookingId },\n  success_url, cancel_url\n})
    Stripe-->>API: { id: "cs_xxx", url: "https://checkout.stripe.com/..." }
    API->>DB: Create Payment { bookingId, stripeSessionId, amount, status: PENDING }
    API-->>FE: { sessionId: "cs_xxx", url: "https://..." }
    FE->>FE: Redirect guest to Stripe URL
```

**Guards:** `ClerkGuard` — user must be logged in; service verifies they own the booking.

**Price is always computed server-side** and stored on the Booking record. The frontend never sends the price.

---

## Webhook — Payment Confirmed

```mermaid
sequenceDiagram
    participant Stripe as Stripe
    participant API as NestJS API
    participant DB as PostgreSQL

    Stripe->>API: POST /api/payments/webhook\nHeaders: stripe-signature: t=...,v1=...\nBody: raw JSON bytes

    API->>API: stripe.webhooks.constructEvent(\n  rawBody, sig, STRIPE_WEBHOOK_SECRET\n)

    alt Signature invalid
        API-->>Stripe: 400 Bad Request
    else Signature valid
        API->>API: Switch on event.type

        alt checkout.session.completed
            API->>DB: Find Payment by stripeSessionId
            API->>DB: Update Payment { status: PAID, stripePaymentIntent: pi_xxx }
            API->>DB: Update Booking { status: CONFIRMED }
            API->>DB: Create BlockedDate rows\nfor each date in checkin→checkout range\n{ unitId, date, source: BOOKING, bookingId }
            API-->>Stripe: 200 { received: true }
        else payment_intent.payment_failed
            API->>DB: Find Payment by stripePaymentIntent
            API->>DB: Update Payment { status: FAILED }
            API-->>Stripe: 200 { received: true }
        else other events
            API-->>Stripe: 200 { received: true }
        end
    end
```

### Raw Body Requirement

```typescript
// In main.ts — MUST come before any body parsers
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// In app.module or main.ts — global JSON parser for all other routes
app.use(express.json());
```

Stripe computes its `stripe-signature` HMAC over the raw request bytes. Once a JSON body parser converts the body to a JavaScript object, the raw bytes are gone and `constructEvent` will throw `400`. The raw body middleware must be registered **first**, scoped to the webhook path only.

---

## BlockedDate Writing on Confirmation

When `checkout.session.completed` fires, the service expands the booking's date range into individual calendar days and upserts each one:

```typescript
// Pseudocode — actual implementation in PaymentsService
const dates = eachDayOfInterval({ start: booking.checkin, end: subDays(booking.checkout, 1) });

for (const date of dates) {
  await prisma.blockedDate.upsert({
    where: { unitId_date: { unitId: booking.unitId, date } },
    create: { unitId: booking.unitId, date, source: 'BOOKING', bookingId: booking.id },
    update: {},  // never overwrite existing rows (could be ICAL or MANUAL)
  });
}
```

`checkout` date is NOT blocked — it is the departure day, not a night the guest occupies.

---

## Admin Refund Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant AF as Admin Frontend
    participant API as NestJS API
    participant Stripe as Stripe API
    participant DB as PostgreSQL

    A->>AF: Clicks "Refund" on a payment
    AF->>API: POST /api/admin/payments/:id/refund
    API->>DB: Find Payment (must be status = PAID)
    API->>Stripe: stripe.refunds.create({\n  payment_intent: payment.stripePaymentIntent\n})
    Stripe-->>API: Refund object { id: "re_xxx", status: "succeeded" }
    API->>DB: Update Payment { status: REFUNDED }
    API->>DB: Update Booking { status: CANCELLED }
    API->>DB: Delete BlockedDate rows where bookingId = X AND source = BOOKING
    API-->>AF: { paymentId, refundId, status: "REFUNDED" }
```

**On refund:**
- Payment record → `REFUNDED`
- Booking record → `CANCELLED`
- All `BOOKING`-sourced `BlockedDate` rows for that `bookingId` are deleted
- Dates become available again for new bookings
- `ICAL` and `MANUAL` blocked dates are never touched

---

## Error Cases

| Scenario | HTTP Code | Handling |
|---|---|---|
| `constructEvent` fails (bad signature) | 400 | Throw immediately, log, return 400 |
| Booking not found in webhook | 404 | Log warning, return 200 (Stripe doesn't retry 200s) |
| Payment already PAID (duplicate webhook) | — | Upsert is idempotent; no harm |
| Payment not PAID on refund attempt | 409 | Return 409 Conflict |
| Stripe refund API error | 500 | Log, rethrow — admin retries manually |
