# 08 — Domain Rules

> All business rules are enforced in the **service layer only**. Controllers receive requests, validate DTOs, and call services. Controllers never contain business logic.

---

## Rule 1 — Availability Conflict Check

**Where:** `AvailabilityService`, `BookingsService`

A date range is considered unavailable if ANY `BlockedDate` row exists for the unit within that range, regardless of `source` (BOOKING, ICAL, or MANUAL).

```typescript
const conflict = await prisma.blockedDate.findFirst({
  where: {
    unitId,
    date: { gte: checkin, lt: checkout },  // checkout day is NOT occupied
  },
});
if (conflict) throw new ConflictException('Dates not available');
```

This check runs **twice**:
1. `GET /api/availability/:unitId` — preview check, returns blocked dates for calendar display
2. `POST /api/bookings` — atomic check at booking creation time (race condition guard)

---

## Rule 2 — On Payment Confirmed: Write BlockedDates

**Where:** `PaymentsService.handleWebhook` → on `checkout.session.completed`

When Stripe confirms payment:
1. Booking status → `CONFIRMED`
2. Payment status → `PAID`
3. Every date from `checkin` (inclusive) to `checkout` (exclusive) is upserted into `BlockedDate` with `source = BOOKING` and `bookingId` populated.

```typescript
const dates = eachDayOfInterval({ start: booking.checkin, end: subDays(booking.checkout, 1) });
for (const date of dates) {
  await prisma.blockedDate.upsert({
    where: { unitId_date: { unitId: booking.unitId, date } },
    create: { unitId: booking.unitId, date, source: 'BOOKING', bookingId: booking.id },
    update: {},
  });
}
```

`update: {}` is intentional — never overwrite an existing row regardless of its source.

---

## Rule 3 — Cancellation: 48-Hour Window

**Where:** `BookingsService.cancel`

A guest can only cancel if the check-in date is **more than 48 hours from now**.

```typescript
const hoursUntilCheckin = differenceInHours(booking.checkin, new Date());
if (hoursUntilCheckin <= 48) {
  throw new ConflictException('Cancellation window has passed. Contact the property for assistance.');
}
```

On cancellation:
1. Booking status → `CANCELLED`
2. Only `BOOKING`-sourced `BlockedDate` rows with that specific `bookingId` are deleted:

```typescript
await prisma.blockedDate.deleteMany({
  where: { bookingId: booking.id, source: 'BOOKING' },
});
```

`ICAL` and `MANUAL` rows are **never touched** by a cancellation.

If the guest is within the 48-hour window, they cannot cancel via the API. The admin must handle refunds manually via `POST /api/admin/payments/:id/refund`.

---

## Rule 4 — Review Eligibility

**Where:** `ReviewsService.create`

A guest can only submit a review if:
1. They have a `Booking` for that unit where `status = COMPLETED`
2. That booking has `reviewed = false`

```typescript
const eligibleBooking = await prisma.booking.findFirst({
  where: {
    userId:   request.auth.userId,
    unitId:   dto.unitId,
    id:       dto.bookingId,
    status:   'COMPLETED',
    reviewed: false,
  },
});
if (!eligibleBooking) throw new ForbiddenException('No eligible booking to review');
```

After a review is submitted:
```typescript
await prisma.booking.update({
  where: { id: dto.bookingId },
  data: { reviewed: true },
});
```

This prevents duplicate reviews. One review per booking, enforced by `@@unique` on `Review.bookingId` in the schema AND the eligibility check in the service.

---

## Rule 5 — Admin Role: Database Only

**Where:** `AdminGuard`, admin user role assignment

Roles (`GUEST` / `ADMIN`) are stored in PostgreSQL only. Clerk does not know about these roles.

- No public API endpoint can promote a user to ADMIN
- `PUT /api/admin/users/:id/role` requires the caller to already be ADMIN (AdminGuard enforces this)
- Initial admin assignment is done directly in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@pbpointe.com';
```

---

## Rule 6 — Pricing Formula

**Where:** `BookingsService.create`, `AvailabilityService.check`

Total price is always computed server-side. The formula:

```typescript
const nights    = differenceInDays(checkout, checkin);
const basePrice = nights * unit.pricePerNight;
const cleaning  = unit.cleaningFee;
const service   = Math.round(nights * Number(unit.pricePerNight) * 0.12);
const total     = basePrice + cleaning + service;
```

| Component | Formula |
|---|---|
| Base Price | `nights × pricePerNight` |
| Cleaning Fee | `unit.cleaningFee` (fixed per unit) |
| Service Fee | `Math.round(nights × pricePerNight × 0.12)` (12%) |
| **Total** | `basePrice + cleaningFee + serviceFee` |

The `totalPrice` is stored on the `Booking` record at creation time and used as the Stripe charge amount. The frontend **never** sends a price — it is computed and trusted from the server only.

---

## Rule 7 — Stripe Webhook Signature Required

**Where:** `PaymentsService.handleWebhook`

Every Stripe webhook event MUST be verified using the raw body and the `stripe-signature` header:

```typescript
let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(
    rawBody,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET,
  );
} catch (err) {
  throw new BadRequestException('Webhook signature verification failed');
}
```

If verification fails, the handler returns `400 Bad Request`. No database operations are performed on unverified events.

---

## Rule 8 — Admin Unblock: MANUAL Source Only

**Where:** `AdminService.unblockDate`

Admins can only delete `BlockedDate` rows where `source = MANUAL`.

```typescript
const row = await prisma.blockedDate.findUnique({ where: { id } });
if (!row) throw new NotFoundException();
if (row.source !== 'MANUAL') {
  throw new ForbiddenException('Only MANUAL-sourced blocked dates can be unblocked via this endpoint');
}
await prisma.blockedDate.delete({ where: { id } });
```

- `BOOKING` rows are removed only via the cancellation flow (Rule 3) or admin refund (which calls the same logic)
- `ICAL` rows are managed exclusively by the iCal sync cron job — admin cannot manually delete them

---

## Rule 9 — Unit Delete: No Active Bookings

**Where:** `UnitsService.delete`

A unit cannot be deleted if it has any `PENDING` or `CONFIRMED` bookings.

```typescript
const activeBookings = await prisma.booking.count({
  where: {
    unitId: id,
    status: { in: ['PENDING', 'CONFIRMED'] },
  },
});
if (activeBookings > 0) {
  throw new ConflictException('Cannot delete a unit with active bookings');
}
await prisma.unit.delete({ where: { id } });
```

`CANCELLED` and `COMPLETED` bookings do not block deletion — they are historical records.
