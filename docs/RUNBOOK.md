# Runbook - Running the E-Commerce Project

Everything you need to start, log in to, test, and stop the project on this machine.
Local development only: all credentials below are seeded demo values. **Change them before any shared or public deployment.**

---

## 1. Prerequisites (already installed on this machine)

| Tool                  | Version used | Purpose                        |
| --------------------- | ------------ | ------------------------------ |
| Node.js               | 22.x         | Runtime                        |
| npm                   | 10.x         | Package manager                |
| Docker Desktop        | 29.x         | Runs PostgreSQL in a container |
| Git Bash / PowerShell | any          | Shell for the commands below   |

---

## 2. Credentials & Connection Details

### 2.1 Application accounts (seeded by `npx prisma db seed`)

| Role     | Email                  | Password       | Can access                                  |
| -------- | ---------------------- | -------------- | ------------------------------------------- |
| ADMIN    | `admin@example.com`    | `Admin123!`    | Everything, plus `/admin/**` and admin APIs |
| CUSTOMER | `customer@example.com` | `Customer123!` | Storefront, cart, checkout, `/account/**`   |

The seed builds the **Laxmi Plastic Stores** catalog: 9 kitchenware categories, 36 products priced in
rupees, 8 reviewer accounts (no password, cannot sign in) leaving 80 reviews, and a Kathmandu
address for the demo customer. Product, category and hero photos are stock placeholders
(images.unsplash.com) and testimonial portraits are generated (i.pravatar.cc) - swap in real assets
via the admin product form or `prisma/seed.ts`. Re-running the seed retires any products from an
older catalog (deleted when unreferenced, otherwise kept inactive).

The demo customer comes with 3 reviews, 1 saved address and 4 sample orders:

| Order                                           | Method           | State            | Shows                                     |
| ----------------------------------------------- | ---------------- | ---------------- | ----------------------------------------- |
| `ORD-DEMO-0001`                                 | Card (Stripe)    | DELIVERED / PAID | a finished card order                     |
| `ORD-DEMO-0002`                                 | Card (Stripe)    | PENDING / UNPAID | an abandoned Stripe checkout              |
| `ORD-DEMO-0003`                                 | Cash on delivery | SHIPPED / UNPAID | goods out, cash not yet collected         |
| `ORD-DEMO-0004`                                 | eSewa            | PENDING / UNPAID | a transfer waiting for admin verification |
| New customers can self-register at `/register`. |

### 2.2 Frontend (Next.js)

| Item             | Value                                    |
| ---------------- | ---------------------------------------- |
| URL              | http://localhost:3000                    |
| Home page        | http://localhost:3000/                   |
| Shop (catalog)   | http://localhost:3000/shop               |
| Wishlist         | http://localhost:3000/wishlist           |
| Sign in          | http://localhost:3000/sign-in            |
| Register         | http://localhost:3000/register           |
| Cart             | http://localhost:3000/cart               |
| Checkout         | http://localhost:3000/checkout           |
| Customer account | http://localhost:3000/account            |
| Admin dashboard  | http://localhost:3000/admin (ADMIN only) |

### 2.3 Backend (Route Handlers, same server)

| Item               | Value                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API base URL       | http://localhost:3000/api                                                                                                                                                               |
| Auth endpoints     | `/api/auth/*` (NextAuth v5: `csrf`, `session`, `callback/credentials`, `signout`)                                                                                                       |
| Registration       | `POST /api/auth/register`                                                                                                                                                               |
| Public catalog     | `GET /api/products`, `GET /api/products/[id]`, `GET /api/categories`, `GET /api/products/[id]/reviews`                                                                                  |
| Customer (login)   | `/api/cart`, `/api/orders`, `/api/orders/[id]`, `/api/addresses`, `/api/addresses/[id]`, `/api/me`, `POST /api/products/[id]/reviews`, `/api/reviews/[id]`                              |
| Admin (ADMIN role) | `POST /api/products`, `PATCH/DELETE /api/products/[id]`, `POST /api/categories`, `PATCH/DELETE /api/categories/[id]`, `/api/admin/orders`, `/api/admin/orders/[id]`, `POST /api/upload` |
| Payments           | `POST /api/checkout` (places the order; returns a Stripe URL for card payments), `POST /api/webhooks/stripe`                                                                            |
| Auth mechanism     | JWT session cookie `authjs.session-token` (set by the credentials callback)                                                                                                             |
| Response shapes    | `{ data }`, `{ data, pagination }`, `{ error, issues? }`                                                                                                                                |

Authenticating an API client manually (what the browser does for you):

```bash
# 1. get a CSRF token (stores the csrf cookie in jar.txt)
curl -s -c jar.txt -b jar.txt http://localhost:3000/api/auth/csrf
# 2. log in (replace TOKEN with the csrfToken value from step 1)
curl -s -c jar.txt -b jar.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "X-Auth-Return-Redirect: 1" \
  --data-urlencode "csrfToken=TOKEN" \
  --data-urlencode "email=customer@example.com" \
  --data-urlencode "password=Customer123!"
# 3. call protected APIs with the cookie jar
curl -s -b jar.txt http://localhost:3000/api/orders
```

### 2.4 Database (PostgreSQL in Docker)

| Item              | Value                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| Container name    | `ecommerce-db` (image `postgres:16-alpine`)                             |
| Host / port       | `localhost:5436` (5432-5435 are used by other projects on this PC)      |
| Database          | `ecommerce`                                                             |
| User / password   | `postgres` / `postgres`                                                 |
| Connection string | `postgresql://postgres:postgres@localhost:5436/ecommerce?schema=public` |
| Data volume       | Docker volume `ecommerce_pgdata`                                        |
| GUI               | `npx prisma studio` -> http://localhost:5555                            |

### 2.5 Environment file (`.env`, git-ignored, already created)

| Variable                             | Current value                     | Notes                                                  |
| ------------------------------------ | --------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                       | connection string above           |                                                        |
| `AUTH_SECRET`                        | random 32-byte base64 (generated) | Regenerate with `openssl rand -base64 32`              |
| `AUTH_URL`                           | `http://localhost:3000`           |                                                        |
| `AUTH_TRUST_HOST`                    | `true`                            | Required for localhost                                 |
| `STRIPE_SECRET_KEY`                  | `sk_test_REPLACE_ME`              | **Placeholder** - card payments hidden / 503 until set |
| `STRIPE_WEBHOOK_SECRET`              | `whsec_REPLACE_ME`                | **Placeholder** - webhook returns 503 until set        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_REPLACE_ME`              | **Placeholder**                                        |
| `NEXT_PUBLIC_APP_URL`                | `http://localhost:3000`           | Used for Stripe success/cancel URLs and sitemap        |
| `RESEND_API_KEY` (optional)          | not set                           | Order emails are logged, not sent, until set           |
| `EMAIL_FROM` (optional)              | not set                           |                                                        |
| `AUTH_GOOGLE_ID/SECRET` (optional)   | not set                           | Enables "Continue with Google" when set                |

Get Stripe test keys at https://dashboard.stripe.com/test/apikeys. For local webhooks run
`stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy the printed `whsec_...` into `.env`.

---

## 3. Commands - First-Time Setup (already done once on this machine)

```bash
cd D:/My-Project/ecommerce
npm install                          # installs deps and generates the Prisma client
cp .env.example .env                 # then edit values (AUTH_SECRET, Stripe keys)
docker compose up -d                 # start PostgreSQL on localhost:5436
npx prisma migrate dev --name init   # create the schema
npx prisma db seed                   # demo users, categories, products, reviews, orders
npm run dev                          # http://localhost:3000
```

## 4. Commands - Every Time You Come Back

```bash
cd D:/My-Project/ecommerce
docker compose up -d                 # 1. database (no-op if already running)
npx prisma migrate deploy            # 2. apply any new migrations (safe to run always)
npm run dev                          # 3. dev server -> http://localhost:3000
```

Optional:

```bash
npx prisma db seed                   # re-seed demo data (idempotent: upserts, never duplicates)
npx prisma studio                    # browse the database at http://localhost:5555
```

## 5. Commands - Quality Checks

```bash
npm run typecheck                    # tsc --noEmit
npm run lint                         # eslint . --max-warnings=0
npm run test                         # vitest unit tests
npm run check                        # all three above
npm run build && npm run start       # production build + server on :3000
```

The suite `lib/orders/fulfill.test.ts` is an integration test that only runs when `DATABASE_URL` is set in the process environment (it is skipped otherwise):

```bash
set -a; source .env; set +a; npx vitest run lib/orders/fulfill.test.ts
```

## 6. Commands - Database Changes

```bash
# 1. edit prisma/schema.prisma
npx prisma migrate dev --name <describe-change>   # creates + applies a migration, regenerates client
# 2. update prisma/seed.ts if the new model needs demo data, then:
npx prisma db seed
```

Never use `prisma db push` outside throwaway experiments (see CLAUDE.md section 5).

## 7. Stopping / Resetting

```bash
# stop the dev server: Ctrl+C in its terminal
docker compose stop                  # stop Postgres, keep data
docker compose down                  # remove the container, keep data (volume)
docker compose down -v               # DESTROY all local data, then re-run migrate + seed
```

## 8. Troubleshooting

| Symptom                                                | Fix                                                                                                                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Can't reach database server at localhost:5436`        | `docker compose up -d`, then `docker ps` should show `ecommerce-db` as Up                                                                                                                                    |
| `Invalid environment variables` at startup             | Compare `.env` with `.env.example`; every non-optional key must be present                                                                                                                                   |
| Port 3000 already in use                               | `npx next dev -p 3001` and set `NEXT_PUBLIC_APP_URL`/`AUTH_URL` to match                                                                                                                                     |
| "Card payments are not configured in this environment" | Expected until real Stripe test keys replace the `REPLACE_ME` placeholders. Cash on delivery, eSewa, IME Pay and bank transfer work without any keys                                                         |
| A manual order stays UNPAID                            | That is the point: an admin records the money at `/admin/orders/[id]` -> "Record payment". Cash on delivery may ship first                                                                                   |
| Order stays PENDING after paying                       | Webhook not reaching the app: run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`; the `/checkout/success` page also fulfils the order on load as a fallback |
| Admin image upload fails                               | Uploads go to `public/uploads/` (local disk); on serverless hosts swap `/api/upload` for S3/UploadThing                                                                                                      |
| Prisma client out of date after pulling changes        | `npx prisma generate`                                                                                                                                                                                        |
| Login works but header still shows old name/role       | Sessions are JWTs; sign out and back in                                                                                                                                                                      |

## 9. Verified On This Machine (2026-09-10)

| Check                                      | Result                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `npm run typecheck`                        | pass                                                              |
| `npm run lint`                             | pass                                                              |
| `npm run test`                             | 362 tests pass, 6 skipped (DB integration suite)                  |
| `npm run build`                            | pass, 47 routes                                                   |
| End-to-end smoke test against `next start` | 85 of 89 checks pass; see docs/PROJECT_PLAN.md for the open items |

---

## 10. Payment Methods

The storefront accepts five methods. Only card payments need Stripe keys; the other four work on a
clean checkout of this repository.

| Method           | Needs config        | What the customer does                   | How it is settled                                  |
| ---------------- | ------------------- | ---------------------------------------- | -------------------------------------------------- |
| Cash on delivery | nothing             | places the order, pays the courier       | admin records the cash after delivery              |
| eSewa            | nothing             | sends money, enters the transaction code | admin verifies the code, then records the payment  |
| IME Pay          | nothing             | sends money, enters the transaction id   | admin verifies the id, then records the payment    |
| Bank transfer    | nothing             | transfers, enters the deposit reference  | admin verifies the deposit, then records it        |
| Card payment     | `STRIPE_SECRET_KEY` | pays on Stripe Checkout                  | Stripe webhook (`/api/webhooks/stripe`) fulfils it |

The merchant details customers are told to pay into (eSewa ID `9800000000`, IME Pay number
`9810000000`, bank account `0123456789012`) are **demo values** in `lib/payments/methods.ts`.
Replace them with the real ones before taking money. eSewa and IME Pay are offline confirmation
flows here, not live gateway integrations.

### Walking the full order flow locally

1. Sign in as the demo customer (or stay a guest) and add a product to the cart.
2. Cart -> **Proceed to checkout** (`/checkout`).
3. Fill in contact and shipping details, or pick a saved address, then choose a payment method.
   eSewa, IME Pay and bank transfer ask for the transaction reference before the order can be placed.
4. **Place order**. The order is created, stock is reserved and the confirmation page shows what is
   still owed. Card payments instead redirect to Stripe.
5. Sign in as the admin, open `/admin/orders`, filter by **Method**, open the order.
   - **Record payment** confirms (or rejects) the money for a manual method.
   - **Update status** moves the order along. Cash on delivery may go PENDING -> SHIPPED before the
     payment is recorded; cancelling any reserved order puts its stock back.
6. Back in the customer account, `/account/orders/<id>` shows the method, the reference and the
   payment progress in the timeline.
