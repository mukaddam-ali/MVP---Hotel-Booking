# 10 — Environment Variables

> All secrets and environment-specific configuration are stored in a `.env` file at the project root. **Never commit `.env` to version control.** Use `.env.example` as the committed template.

---

## Variables Reference

### App

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `NODE_ENV` | Yes | Runtime environment. `development` locally, `production` in deployment | Set manually |
| `PORT` | Yes | Port the NestJS server listens on | Set manually (default: `4000`) |

---

### Database

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma | Railway, Supabase, or local Postgres |

**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

Example (local): `postgresql://postgres:password@localhost:5432/pbpointe`
Example (Railway): `postgresql://postgres:abc123@monorail.proxy.rlwy.net:12345/railway`

---

### Clerk Authentication

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `CLERK_SECRET_KEY` | Yes | Server-side secret key used in `verifyToken()` inside ClerkGuard | Clerk Dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Optional | Frontend-only key; not used by the backend but good to document | Clerk Dashboard → API Keys |

**Steps:**
1. Go to [clerk.com](https://clerk.com) → Create Application
2. Set application name to "Pompano Beach Pointe"
3. Enable Email/Password sign-in (minimum)
4. Copy `Secret key` (starts with `sk_test_` in development)

---

### Frontend Origins (CORS)

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `CUSTOMER_FRONTEND_URL` | Yes | Origin allowed in CORS for the customer site | Set to your customer frontend domain |
| `ADMIN_FRONTEND_URL` | Yes | Origin allowed in CORS for the admin site | Set to your admin frontend domain |

**Local development:**
```
CUSTOMER_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
```

**Production:**
```
CUSTOMER_FRONTEND_URL=https://pbpointe.com
ADMIN_FRONTEND_URL=https://admin.pbpointe.com
```

These are used in `main.ts`:
```typescript
app.enableCors({
  origin: [process.env.CUSTOMER_FRONTEND_URL, process.env.ADMIN_FRONTEND_URL],
  credentials: true,
});
```

---

### Stripe

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Server-side key for creating sessions and refunds | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Yes | Signing secret for verifying webhook payloads | Stripe Dashboard → Webhooks → Add endpoint |
| `STRIPE_CURRENCY` | Yes | ISO currency code for all charges | Set to `usd` |

**Steps:**
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Developers → API Keys → copy **Secret key** (starts with `sk_test_` in test mode)
3. Developers → Webhooks → Add endpoint
   - URL: `https://api.pbpointe.com/api/payments/webhook`
   - Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`
4. After creating the webhook, reveal and copy the **Signing secret** (starts with `whsec_`)

**Local webhook testing:** Use the Stripe CLI:
```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```
The CLI outputs a local `whsec_` secret to use in `.env` during development.

---

### Cloudinary

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name | Cloudinary Dashboard → Account Details |
| `CLOUDINARY_API_KEY` | Yes | API key for authenticated uploads | Cloudinary Dashboard → Account Details |
| `CLOUDINARY_API_SECRET` | Yes | API secret for authenticated uploads | Cloudinary Dashboard → Account Details |

**Steps:**
1. Go to [cloudinary.com](https://cloudinary.com) → Create a free account
2. Dashboard shows Cloud name, API Key, and API Secret directly
3. Optionally create separate upload presets for unit images vs. gallery images

---

## .env.example

```dotenv
# ─── App ──────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=4000

# ─── Database ─────────────────────────────────────────────────────────────────
# PostgreSQL connection string (Prisma format)
# Local:    postgresql://postgres:password@localhost:5432/pbpointe
# Railway:  postgresql://postgres:abc123@monorail.proxy.rlwy.net:12345/railway
DATABASE_URL=postgresql://user:password@localhost:5432/pbpointe

# ─── Clerk Authentication ─────────────────────────────────────────────────────
# Get from: Clerk Dashboard → API Keys
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Frontend Origins (CORS) ──────────────────────────────────────────────────
# Development
CUSTOMER_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
# Production (uncomment and update)
# CUSTOMER_FRONTEND_URL=https://pbpointe.com
# ADMIN_FRONTEND_URL=https://admin.pbpointe.com

# ─── Stripe ───────────────────────────────────────────────────────────────────
# Get from: Stripe Dashboard → Developers → API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get from: Stripe Dashboard → Webhooks → Add endpoint → Signing secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_CURRENCY=usd

# ─── Cloudinary ───────────────────────────────────────────────────────────────
# Get from: Cloudinary Dashboard → Account Details
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=000000000000000
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Environment Validation (Recommended)

Add runtime validation at startup using `@nestjs/config` with Joi or `zod` so the app fails fast with a clear error if a required variable is missing:

```typescript
// In AppModule
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV:               Joi.string().valid('development', 'production').required(),
    PORT:                   Joi.number().default(4000),
    DATABASE_URL:           Joi.string().required(),
    CLERK_SECRET_KEY:       Joi.string().required(),
    CUSTOMER_FRONTEND_URL:  Joi.string().uri().required(),
    ADMIN_FRONTEND_URL:     Joi.string().uri().required(),
    STRIPE_SECRET_KEY:      Joi.string().required(),
    STRIPE_WEBHOOK_SECRET:  Joi.string().required(),
    STRIPE_CURRENCY:        Joi.string().default('usd'),
    CLOUDINARY_CLOUD_NAME:  Joi.string().required(),
    CLOUDINARY_API_KEY:     Joi.string().required(),
    CLOUDINARY_API_SECRET:  Joi.string().required(),
  }),
})
```
