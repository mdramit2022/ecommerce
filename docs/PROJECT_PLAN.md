# E-Commerce Platform - Project Plan

> Living document. Update the status column as work lands. Read `CLAUDE.md` before making changes.

## 1. Vision

**Laxmi Plastic Stores** - a modern, full-stack storefront for a Nepali kitchenware and household shop: a merchandised home page, a searchable catalog, a cart and wishlist, checkout with cash on delivery, eSewa, IME Pay, bank transfer or card, order tracking and reviews. Prices are in Nepali rupees. An admin area manages products, categories, orders and manual payments.

## 2. Tech Stack

| Layer        | Choice                                    | Notes                                        |
| ------------ | ----------------------------------------- | -------------------------------------------- |
| Framework    | Next.js 15 (App Router), React 19         | Server Components by default                 |
| Language     | TypeScript (strict)                       | No `any`                                     |
| Styling      | Tailwind CSS v4                           | CSS-first config in `app/globals.css`        |
| Database     | PostgreSQL 15+                            | Local via Docker or hosted (Neon / Supabase) |
| ORM          | Prisma 6                                  | Migrations are the only way to change schema |
| Auth         | NextAuth.js v5 (Auth.js) + Prisma adapter | Credentials + OAuth; `role` on session       |
| Payments     | Stripe Checkout + Webhooks                | Prices computed server-side from the DB      |
| Client state | Zustand (persisted)                       | Guest cart in `localStorage`                 |
| Validation   | Zod                                       | Every API body / query is parsed             |
| Testing      | Vitest + Testing Library, Playwright      | Unit + E2E                                   |
| Deploy       | Vercel + managed Postgres                 | Stripe webhook endpoint registered per env   |

## 3. Architecture Overview

```
Browser --> Next.js App Router
             |-- Server Components --> Prisma --> PostgreSQL
             |-- Client Components --> Zustand (cart) / fetch(/api/*)
             `-- Route Handlers (/app/api/*)
                    |-- /api/products          (catalog read + admin create)
                    |-- /api/checkout          (places the order; Stripe session for cards)
                    |-- /api/webhooks/stripe   (payment confirmation)  [Phase 1]
                    `-- /api/auth/[...nextauth]
Stripe --webhook--> /api/webhooks/stripe --> Order.status = PAID
```

## 4. Folder Layout

```
app/                     Routes, layouts, route handlers
  api/                   Route Handlers only
  products/[slug]/       Product detail            [Phase 1]
  cart/                  Cart page                 [Phase 1]
  checkout/              Payment page + success / cancel pages
  account/               Authenticated customer    [Phase 2]
  admin/                 Admin dashboard           [Phase 3]
components/              Reusable UI (server by default)
lib/                     Server/client utilities
  prisma.ts              Prisma singleton
  stripe.ts              Stripe singleton
  auth.ts                NextAuth config + helpers
  store/                 Zustand stores
  validations/           Zod schemas
prisma/                  schema.prisma, migrations/, seed.ts
types/                   Shared TS types and module augmentations
docs/                    Plans, ADRs
```

## 5. Data Model (summary)

- **User** - role `CUSTOMER | ADMIN`; owns Cart, Orders, Reviews, Addresses
- **Category** - name, slug -> many Products
- **Product** - title, slug, description, price (Decimal), stock, images[], category
- **Cart / CartItem** - linked to a User _or_ an anonymous sessionId
- **Order / OrderItem** - status, paymentStatus, Stripe IDs, shipping-address snapshot, price snapshots
- **Review** - rating 1-5, comment; unique per (user, product)
- **Account / Session / VerificationToken** - NextAuth adapter tables

Full schema: `prisma/schema.prisma`.

## 6. Delivery Phases

### Phase 0 - Foundation (this deliverable)

| #   | Item                                                  | Status |
| --- | ----------------------------------------------------- | ------ |
| 1   | `CLAUDE.md` governance file                           | Done   |
| 2   | Project plan (`docs/PROJECT_PLAN.md`)                 | Done   |
| 3   | Prisma schema                                         | Done   |
| 4   | Prisma / Stripe singletons                            | Done   |
| 5   | NextAuth config + role typing                         | Done   |
| 6   | `GET/POST /api/products`                              | Done   |
| 7   | `POST /api/checkout`                                  | Done   |
| 8   | Storefront page, ProductCard, filters, pagination     | Done   |
| 9   | Zustand cart store                                    | Done   |
| 10  | Tooling: package.json, tsconfig, Tailwind, env sample | Done   |
| 11  | Seed script + docker-compose for Postgres             | Done   |

### Phase 1 - Commerce Core (next)

| #   | Item                                                                           | Status |
| --- | ------------------------------------------------------------------------------ | ------ |
| 1   | `POST /api/webhooks/stripe` - mark order PAID, decrement stock, store shipping | Todo   |
| 2   | Product detail page `app/products/[slug]/page.tsx`                             | Todo   |
| 3   | Cart page + cart drawer (`/cart`)                                              | Todo   |
| 4   | Checkout success / cancel pages                                                | Todo   |
| 5   | Auth pages: sign-in, register (`bcrypt` hashing)                               | Todo   |
| 6   | Server-side cart sync for logged-in users (`/api/cart`)                        | Todo   |
| 7   | Rate limiting on public write endpoints                                        | Todo   |

### Phase 2 - Customer Account

| #   | Item                                              | Status |
| --- | ------------------------------------------------- | ------ |
| 1   | Order history `/account/orders`, order detail     | Todo   |
| 2   | Address book CRUD                                 | Todo   |
| 3   | Reviews: `POST /api/products/[id]/reviews`, UI    | Todo   |
| 4   | Transactional email (order confirmation) - Resend | Todo   |

### Phase 3 - Admin

| #   | Item                                             | Status |
| --- | ------------------------------------------------ | ------ |
| 1   | Admin layout + role guard middleware             | Todo   |
| 2   | Product CRUD UI, image upload (UploadThing / S3) | Todo   |
| 3   | Category CRUD                                    | Todo   |
| 4   | Order management (status transitions, refunds)   | Todo   |
| 5   | Dashboard metrics                                | Todo   |

### Phase 5 - Payment Methods

Customers could not order at all while the Stripe keys were placeholders. The checkout now offers a
menu of methods and only card payments depend on Stripe.

| #   | Item                                                                                   | Status |
| --- | -------------------------------------------------------------------------------------- | ------ |
| 1   | `PaymentMethod` enum + `paymentMethod` / `paymentReference` on Order (migration)       | Done   |
| 2   | Payment method catalogue `lib/payments/methods.ts` (labels, instructions, references)  | Done   |
| 3   | `/checkout` page: contact, shipping address, payment menu (Server + Client Components) | Done   |
| 4   | `POST /api/checkout` places manual orders and reserves stock in one transaction        | Done   |
| 5   | Admin: record / reject manual payments, method column + filter, restock on cancel      | Done   |
| 6   | Payment-method-aware status graph (cash on delivery ships before it is paid)           | Done   |
| 7   | Confirmation page, account order detail and email carry the payment instructions       | Done   |
| 8   | Tests: method catalogue, countries, pricing, timeline, checkout schema, DB placement   | Done   |

Not included: live eSewa / IME Pay gateway integrations (both are offline confirmation flows here),
and a non-USD currency - product prices and `Order.currency` are still USD.

### Phase 6 - Storefront Redesign (Laxmi Plastic Stores)

Home page and shell rebuilt to the supplied desktop + mobile design; the catalog moved to `/shop`.

| #   | Item                                                                                          | Status |
| --- | --------------------------------------------------------------------------------------------- | ------ |
| 1   | Brand tokens (`brand-*` in `globals.css`), identity + copy in `lib/brand.ts`, inline icon set | Done   |
| 2   | Rupee pricing everywhere (`formatPrice` -> `Rs. 3,250`), `Order.currency` default `npr`       | Done   |
| 3   | Kitchenware catalog seed: 9 categories, 36 products, 8 reviewer accounts, 80 reviews          | Done   |
| 4   | Shell: announcement bar, header (search, location, account, wishlist, cart), category nav     | Done   |
| 5   | Mobile shell: hamburger drawer, search + location rows, fixed bottom tab bar                  | Done   |
| 6   | Home: category sidebar + hero carousel, category circles, best sellers, promo tiles, arrivals | Done   |
| 7   | Home: trust badges, testimonials, real review aggregate, store info; navy footer + newsletter | Done   |
| 8   | `/shop` catalog (search, category, sort, best-seller and on-sale filters) with card ratings   | Done   |
| 9   | Wishlist: persisted store, hearts on cards, header/tab counts, `/wishlist` page               | Done   |
| 10  | Tests: pricing, brand SEO, merchandising rules, rating helpers, wishlist toggle, sitemap      | Done   |

Known gaps: product and category photos are stock placeholders (Unsplash) and testimonial portraits are
generated avatars; replace them with real assets. The newsletter form is not connected to a mailing
list. Footer links to About / Contact / FAQ / policy pages point at routes that do not exist yet.

### Phase 4 - Quality & Launch

| #   | Item                                           | Status |
| --- | ---------------------------------------------- | ------ |
| 1   | Vitest unit tests (validations, price math)    | Todo   |
| 2   | Playwright E2E: browse -> cart -> checkout     | Todo   |
| 3   | SEO: metadata, sitemap, JSON-LD product schema | Todo   |
| 4   | Observability: Sentry, structured logging      | Todo   |
| 5   | CI (lint, typecheck, test, prisma validate)    | Todo   |
| 6   | Production deploy + Stripe live keys           | Todo   |

## 7. What Is Still Missing (to run the full project)

These are **not** included in Phase 0 and must be built before the store is usable end-to-end:

1. **Stripe webhook handler** - without it orders never move from `PENDING` to `PAID`.
2. **Product detail, cart, and checkout result pages** - the storefront currently only lists products.
3. **Auth UI** - sign-in / register pages and the `bcrypt` password flow (config is wired, pages are not).
4. **Admin UI** - the API supports admin product creation; there is no dashboard yet.
5. **Server cart persistence** - cart is client-only (`localStorage`) until `/api/cart` exists.
6. **Image hosting** - `Product.images` stores URLs; an upload pipeline is needed for admins.
7. **Emails, tests, CI, observability** - see Phases 2-4.
8. **Infrastructure** - a running PostgreSQL instance, Stripe account keys, OAuth provider credentials.

## 8. Local Setup Checklist

```bash
npm install
cp .env.example .env            # fill DATABASE_URL, AUTH_SECRET, STRIPE_*
docker compose up -d            # optional local Postgres
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## 9. Key Decisions (ADR-lite)

- **Prices as `Decimal(10,2)` in Nepali rupees**, converted to integer paisa only at the Stripe boundary. Never trust client prices. Display goes through `formatPrice()` (`Rs. 3,250`); historic `usd` orders still render as dollars.
- **Home vs. catalog**: `/` is a merchandised landing page driven by real data (featured products ranked by review volume, newest products, store-wide review aggregate); `/shop` is the searchable catalog. Category order is creation order (the seed creates them in menu order).
- **Wishlist is browser-side** (Zustand + localStorage, like the guest cart) - there is no server record or API for it.
- **Order snapshots**: `OrderItem` stores `title` and `unitPrice` at purchase time; `Order` stores the shipping address inline.
- **Soft-delete products** via `isActive`; `OrderItem.productId` uses `onDelete: Restrict` to keep history intact.
- **Guest checkout allowed**: `Order.userId` is nullable; `email` is always captured.
- **Payment methods are data, not branches**: `lib/payments/methods.ts` drives the checkout menu, the
  instructions and whether a transaction reference is required. Only `STRIPE` is settled online.
- **Manual orders reserve stock at placement**, Stripe orders only on payment. `hasReservedStock()`
  in `lib/orders/status.ts` is the single rule, used when cancelling restocks an order.
- **ProductCard is a Server Component**; only `AddToCartButton` is a Client Component.
- **The shipping address is collected on `/checkout`** and snapshotted onto the Order for every
  method. Stripe also collects one during its own Checkout; the webhook overwrites the snapshot with
  what Stripe reports. Shipping columns stay nullable for historic orders.
