# 04 — Auth Flow

## Overview

Authentication is fully delegated to **Clerk**. The NestJS backend never issues tokens, stores passwords, or manages sessions. It only **verifies** Clerk-issued JWTs on incoming requests.

Roles (`GUEST` / `ADMIN`) are NOT managed by Clerk — they live in the PostgreSQL `User` table.

---

## Flow 1 — New User Signup

```mermaid
sequenceDiagram
    participant G as Guest
    participant CF as Customer Frontend
    participant Clerk as Clerk (External)
    participant API as NestJS API
    participant DB as PostgreSQL

    G->>CF: Clicks "Sign Up"
    CF->>Clerk: Opens Clerk signup modal/page
    G->>Clerk: Enters name, email, password
    Clerk-->>CF: Returns signed JWT session token
    CF->>API: POST /api/auth/sync\nBody: { clerkId, name, email }\nAuthorization: Bearer <token> (optional)
    API->>DB: upsert User\n{ where: { id: clerkId }, create: {...}, update: { name, email } }
    DB-->>API: User record { id, name, email, role: "GUEST" }
    API-->>CF: { id, name, email, role: "GUEST" }
    CF->>CF: Stores role in state\nRedirects to home
```

**Key points:**
- `/api/auth/sync` is public — no Clerk JWT required to call it (the user just signed up)
- It uses `upsert` so re-calling it (e.g. page refresh after signup) is idempotent
- The returned `role` tells the frontend whether to show "Visit admin portal" or the normal guest experience

---

## Flow 2 — Guest Making a Protected Request

```mermaid
sequenceDiagram
    participant G as Guest
    participant CF as Customer Frontend
    participant Clerk as Clerk SDK
    participant API as NestJS API
    participant DB as PostgreSQL

    G->>CF: Clicks "Book Now"
    CF->>Clerk: getToken() — retrieve current session JWT
    Clerk-->>CF: Returns signed JWT (from session)
    CF->>API: POST /api/bookings\nAuthorization: Bearer <jwt>
    API->>API: ClerkGuard runs\nverifyToken(jwt, CLERK_SECRET_KEY)
    alt Token valid
        API->>API: Extracts sub → request.auth = { userId: "user_2abc..." }
        API->>DB: Execute booking logic
        DB-->>API: Booking record
        API-->>CF: 201 Created
    else Token invalid or missing
        API-->>CF: 401 Unauthorized
    end
```

---

## Flow 3 — Admin Login and Role Check

```mermaid
sequenceDiagram
    participant A as Admin
    participant AF as Admin Frontend
    participant Clerk as Clerk (External)
    participant API as NestJS API
    participant DB as PostgreSQL

    A->>AF: Navigates to admin.pbpointe.com
    AF->>Clerk: Opens Clerk login
    A->>Clerk: Logs in with credentials
    Clerk-->>AF: Returns signed JWT
    AF->>API: POST /api/auth/sync\nBody: { clerkId, name, email }
    API->>DB: upsert User
    DB-->>API: { id, name, email, role: "ADMIN" }
    API-->>AF: { role: "ADMIN" }

    alt role === "ADMIN"
        AF->>AF: Load admin dashboard
    else role === "GUEST"
        AF->>AF: Show "Access Denied" page
    end

    Note over AF,API: All subsequent admin API calls include\nAuthorization: Bearer <jwt>

    A->>AF: Navigates to manage units
    AF->>API: GET /api/bookings\nAuthorization: Bearer <jwt>
    API->>API: ClerkGuard → verifyToken → userId extracted
    API->>DB: findUnique User by userId
    DB-->>API: { role: "ADMIN" }
    API->>API: AdminGuard passes
    API-->>AF: 200 OK + bookings data
```

---

## ClerkGuard Implementation

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
    request.auth = { userId: payload.sub }; // Clerk userId attached to request
    return true;
  }
}
```

- Runs on every route decorated with `@UseGuards(ClerkGuard)`
- On success, attaches `request.auth.userId` for downstream use
- `verifyToken` from `@clerk/backend` handles JWT signature verification, expiry, and issuer checks

---

## AdminGuard Implementation

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

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

- Always runs AFTER `ClerkGuard` (both applied on admin routes: `@UseGuards(ClerkGuard, AdminGuard)`)
- Looks up the user in PostgreSQL using the Clerk userId extracted by ClerkGuard
- Returns `403 Forbidden` if user exists but is not an ADMIN
- Returns `401 Unauthorized` if ClerkGuard didn't run first (safety check)

---

## Guard Usage on Routes

```typescript
// Public route — no guards
@Get('units')
findAll() { ... }

// Authenticated guest route
@UseGuards(ClerkGuard)
@Post('bookings')
createBooking() { ... }

// Admin-only route
@UseGuards(ClerkGuard, AdminGuard)
@Get('admin/stats')
getStats() { ... }
```

---

## Two-Frontend Strategy

| Frontend | Domain | Users | On load |
|---|---|---|---|
| Customer | pbpointe.com | Guests (+ admins who landed here) | Calls `/api/auth/sync` after signup; if role = ADMIN, shows "Visit admin portal" link |
| Admin | admin.pbpointe.com | Admins only | Calls `/api/auth/sync` on every load; if role ≠ ADMIN, redirects to Access Denied page |

Both frontends use the **same Clerk application** and the **same backend**. The differentiation is purely in the frontend's response to the `role` field returned from `/api/auth/sync`.

---

## Admin Role Assignment

Clerk does NOT manage roles. There is **no API endpoint** to self-promote to admin.

To make a user admin after they have signed up:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@pbpointe.com';
```

Or via a one-time Prisma script:

```typescript
await prisma.user.update({
  where: { email: 'admin@pbpointe.com' },
  data: { role: 'ADMIN' },
});
```
