# CLAUDE.md - Project Governance & Memory

This file is the single source of truth for how this repository is built and maintained.
**Every Claude session must read this file before adding features, routes, components, or database models.**
If a rule here conflicts with an ad-hoc request, surface the conflict before proceeding.

Companion documents:

- `docs/PROJECT_PLAN.md` - roadmap, phase status, known limitations. Update it when work lands.
- `docs/RUNBOOK.md` - how to run the project, demo credentials, connection details, troubleshooting.
- `docs/AUDIT.md` - the go-live audit (verified findings, blockers, priorities, page matrix). Re-generate after major changes; work the blockers list before launch.

---

## 1. Project Summary

**Laxmi Plastic Stores** - a Nepali kitchenware & household storefront (prices in Rs.). Full-stack e-commerce: a merchandised home page (hero carousel, category circles, best sellers, promo tiles, new arrivals, trust badges, testimonials), a searchable catalog at `/shop`, product pages with reviews, a browser-side wishlist, persistent cart (guest + server-synced), a checkout page offering several payment methods (cash on delivery, eSewa, IME Pay, bank transfer, and Stripe card payments), customer account (orders, addresses, profile), and an admin area (dashboard, products with image upload, categories, orders, customers).

Brand identity (name, wordmark, tagline) lives in `lib/brand.ts`; brand colours are Tailwind theme tokens (`brand-navy`, `brand-blue`, `brand-red`, `brand-orange`, `brand-gold`, `brand-surface`) in `app/globals.css`. Everything else on the home page and in the shell is **admin-managed content** stored in the database (`Banner`, `Testimonial`, `SiteContentItem`, `SiteSetting`) and edited under `/admin/banners`, `/admin/testimonials`, `/admin/content` and `/admin/settings`; `lib/brand.ts` only holds the defaults the seed writes once.

## 2. Tech Stack

| Concern      | Technology                                                    | Version pin / notes                                                                        |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Framework    | Next.js (App Router)                                          | 15.5, React 19. `params`/`searchParams` are Promises.                                      |
| Language     | TypeScript                                                    | `strict: true`, `noUncheckedIndexedAccess`. `any` forbidden.                               |
| Styling      | Tailwind CSS                                                  | v4, CSS-first config in `app/globals.css`.                                                 |
| Database     | PostgreSQL 16                                                 | Local via `docker-compose.yml` on host port **5436**.                                      |
| ORM          | Prisma                                                        | 6.x, `prisma-client-js` generator.                                                         |
| Auth         | NextAuth.js v5 (Auth.js) + `@auth/prisma-adapter`             | JWT sessions. Edge-safe config in `lib/auth.config.ts`, full config in `lib/auth.ts`.      |
| Payments     | Stripe SDK 17 (Checkout Sessions + Webhooks) + manual methods | Server computes all amounts from DB prices. Method catalogue in `lib/payments/methods.ts`. |
| Email        | Resend                                                        | `lib/email.ts`; no-ops when `RESEND_API_KEY` is unset.                                     |
| Client state | Zustand 5                                                     | `lib/store/useCart.ts`, persisted to `localStorage`.                                       |
| Validation   | Zod 3                                                         | `lib/validations/*`. Every request body/query/form parsed.                                 |
| Tests        | Vitest 5                                                      | Colocated `*.test.ts`; `tests/` for cross-cutting helpers.                                 |
| CI           | GitHub Actions                                                | `.github/workflows/ci.yml`: typecheck, lint, test, build, migrate check.                   |

## 3. Folder Layout (do not invent new top-level folders without updating this section)

```
app/                        Routes, layouts, boundaries, Route Handlers, Server Actions
  api/<resource>/route.ts     Route Handlers only (no React)
  (auth)/                     /sign-in, /register (route group, own layout, actions.ts)
  account/                    Customer area (middleware-protected, layout re-checks auth)
  admin/                      Admin area (middleware-protected, layout re-checks role)
                              catalog: products/, categories/, orders/, customers/
                              home page content: banners/, testimonials/, content/, settings/
  page.tsx                    Home page (merchandised landing); shop/ is the searchable catalog
  cart/, checkout/, products/, shop/, wishlist/  Storefront routes
  <area>/actions.ts           Server Actions for that area ("use server" at top)
components/                 Reusable UI. Server Components unless the file starts with "use client"
  ui/                         Primitives: Button, Input/Textarea/Select, Label/Field, Badge, Alert, Card/PageHeader/EmptyState, Icon (inline SVG set)
  layout/                     Shell: AnnouncementBar, SiteHeader (+ AccountMenu, HeaderSearch, MobileMenu; LocationPicker exists but is hidden), CategoryNav/CategoryMenu, SiteFooter, MobileTabBar, Logo, ContentIcon
  home/                       Home page sections (HeroCarousel, SideBanner, CategoryCircles, ProductStrip, PromoBanners, TrustBadges, TestimonialCarousel, StoreInfo)
  admin/                      Admin forms and tables, incl. BannerForm, TestimonialForm, ContentListEditor, SettingsForm, ImageField (single-image URL + upload)
  <domain>/                   account/, admin/, auth/, cart/, checkout/, product/, reviews/, shop/, wishlist/
lib/                        Framework-agnostic helpers, singletons, domain modules
  brand.ts                    Store identity + the DEFAULT content the seed writes once (pure, client-safe)
  catalog/                    categories.ts (nav categories, cached), home.ts (home strips), merchandising.ts (pure badge rules)
  content/                    kinds.ts (placements, themes, icon keys, setting fields - pure), serialize.ts, settings.ts (pure), site.ts (storefront readers, cached)
  prisma.ts, stripe.ts, email.ts, env.ts, rate-limit.ts, utils.ts, serializers.ts
  auth.ts                     NextAuth (Node): auth(), signIn, signOut, requireUser(), requireAdmin()
  auth.config.ts              Edge-safe NextAuth config used by middleware.ts (NO Prisma/bcrypt imports)
  store/                      Zustand stores (client only): useCart, useWishlist
  validations/                Zod schemas - the ONLY place schemas live
  payments/                   methods.ts (payment method catalogue), countries.ts - pure, client-safe
  <domain>/                   account/, admin/, cart/, orders/, payments/, reviews/, seo/, uploads/, users/
                              (Prisma selects, serializers, business logic per domain)
types/                      Shared serialisable types (product.ts, order.ts, cart.ts, review.ts, content.ts) + next-auth.d.ts
prisma/                     schema.prisma, migrations/, seed.ts
tests/                      Test helpers and cross-cutting tests (tests/seo/*)
public/uploads/             Local admin image uploads (git-ignored except .gitkeep)
docs/                       PROJECT_PLAN.md, RUNBOOK.md
.github/                    CI workflow, dependabot
middleware.ts               Route protection for /account/** and /admin/**
```

Path alias: `@/*` maps to the repository root.

## 4. Code Standards

### 4.1 Server vs. Client Components

- **Default to Server Components.** Fetch data with Prisma directly; never `fetch` your own API routes from the server.
- Add `"use client"` **only** for state, effects, browser APIs, event handlers, or client-only libraries (Zustand, `useActionState`).
- Push `"use client"` to the leaves (`ProductCard` is a Server Component; `AddToCartButton` inside it is a Client Component).
- Never import `@/lib/prisma`, `@/lib/auth`, `@/lib/stripe`, `@/lib/env`, `@/lib/email` or `node:*` from a Client Component.
- Data crossing Server -> Client must be serialisable: `Decimal` -> `number`, `Date` -> ISO string. Use the serializers in `lib/serializers.ts`, `lib/orders/serialize.ts`, `lib/reviews/serialize.ts`.
- Persisted client state (cart) must be rendered behind `useHydrated()` to avoid hydration mismatches.

### 4.2 Streaming, `notFound()` and `redirect()`

- A `loading.tsx` above a route makes Next flush the shell with HTTP 200 **before** the page runs, so `notFound()`/`redirect()` inside that page can no longer set 404/307 (they degrade to client-side meta refresh / noindex).
- Therefore: **no `loading.tsx` at `app/` root or above any route that may call `notFound()` or `redirect()`.** Put skeletons in a `<Suspense>` _inside_ the page, below the code that decides 404/redirect. `app/admin/loading.tsx` is the accepted exception (admin is not indexed).

### 4.3 TypeScript

- `strict` mode. **No `any`**, no `@ts-ignore`, no non-null assertions (`!`) unless commented with a reason.
- Prefer `unknown` + narrowing. Derive types from Prisma (`Prisma.XGetPayload<...>`) and Zod (`z.infer`) instead of duplicating.
- Export component prop types as `<ComponentName>Props`.

### 4.4 Route Handlers (`app/api/**/route.ts`)

- Export named HTTP methods. One resource per folder. Signature: `(request: NextRequest, { params }: { params: Promise<{ id: string }> })`.
- Parse input with Zod `safeParse`. Return `400 { error, issues }` on failure; `401` unauthenticated; `403` forbidden; `404` missing/other user's resource; `409` conflicts; `429` rate limited; `503` when a dependency is not configured (e.g. Stripe placeholders).
- Auth guards: `requireUser()` / `requireAdmin()` from `@/lib/auth`. Ownership is enforced in the query (`where: { id, userId }`), never only in UI.
- Response shapes: list `{ data: T[], pagination: { page, limit, total, totalPages } }`, single `{ data: T }`, error `{ error: string, issues?: ZodIssue[] }`. (Exception: `POST /api/checkout` 400/409 add `productIds` / `items` so the cart can reconcile.)
- Wrap multi-write operations in `prisma.$transaction`. Log server-side; never leak stack traces or Prisma errors.
- Public write endpoints are rate limited with `lib/rate-limit.ts` (register, checkout, reviews, upload).

### 4.5 Server Actions & forms

- Actions live in `app/<area>/actions.ts` with `"use server"` at the top; they return `{ error?, fieldErrors?, success? }` state for `useActionState`.
- Re-check `auth()` inside every action (middleware is a convenience, not the authority). Call `revalidatePath` after mutations.
- Never wrap `redirect()`/`signIn()` in a `try/catch` that swallows errors - re-throw anything that is not an `AuthError`.

### 4.6 Styling & naming

- Tailwind utilities only; use `cn()` for conditional classes; primitives in `components/ui/`.
- Brand colours come from the `brand-*` theme tokens in `app/globals.css` (`bg-brand-blue`, `text-brand-red`, ...); never hard-code the hex values in components. Icons are the inline set in `components/ui/Icon.tsx` (no icon dependency).
- Money is always rendered with `formatPrice()` from `lib/utils.ts`: rupees as `Rs. 3,250` (paisa only when non-zero), other ISO codes via `Intl`.
- Files: `kebab-case` for routes/utilities, `PascalCase.tsx` for components. Zod: `<entity><Action>Schema`. Stores: `use<Name>`.

### 4.7 Tests

- Unit tests are colocated `*.test.ts` and run with `npm run test`. Pure modules only (`lib/**`); never import modules that read env at import time (`lib/env.ts`, `lib/prisma.ts`, `lib/auth.ts`, `lib/stripe.ts`, `lib/email.ts`).
- `lib/orders/fulfill.test.ts` is a DB integration test guarded by `DATABASE_URL` in the process env (skipped otherwise; CI runs it in the `migrate-check` job).
- When you add a pure helper or schema, add a test next to it.

## 5. Database Rules

1. **All schema changes go through Prisma migrations.** `npx prisma migrate dev --name <change>`. Never `db push` outside throwaway prototypes.
2. **Every relation declares an explicit `onDelete`.** `Cascade` for owned children (CartItem, Review, Address, Account, Session); `Restrict` where history must survive (OrderItem -> Product, Product -> Category); `SetNull` for optional ownership (Order -> User).
3. `@@index` on every foreign key and every column used in `where`/`orderBy`.
4. Money is `Decimal @db.Decimal(10, 2)`; convert to integer cents only at the Stripe boundary (`toMinorUnits`).
5. `cuid()` IDs; every model has `createdAt`/`updatedAt`.
6. Soft-delete products via `isActive = false`; never hard-delete anything referenced by orders. Categories with products cannot be deleted (409).
7. After changing `schema.prisma`: `npx prisma generate`, update `prisma/seed.ts` (idempotent upserts only), update section 6 below.

## 6. Current Data Model (keep in sync with `prisma/schema.prisma`)

| Model                                 | Purpose                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User                                  | `role: CUSTOMER \| ADMIN`, optional `passwordHash` (null for OAuth)                                                                                                                                                                                                                                                               |
| Account / Session / VerificationToken | NextAuth adapter tables                                                                                                                                                                                                                                                                                                           |
| Address                               | Saved customer addresses, one `isDefault` per user                                                                                                                                                                                                                                                                                |
| Category                              | `name`, `slug` (unique)                                                                                                                                                                                                                                                                                                           |
| Product                               | `price` Decimal, `compareAtPrice`, `stock`, `images[]`, `isActive`, `isFeatured`                                                                                                                                                                                                                                                  |
| Cart / CartItem                       | Per user (`userId` unique) or anonymous `sessionId`; unique (cart, product)                                                                                                                                                                                                                                                       |
| Order / OrderItem                     | `status` PENDING/PAID/SHIPPED/DELIVERED/CANCELLED, `paymentStatus` UNPAID/PAID/FAILED/REFUNDED, `paymentMethod` STRIPE/CASH_ON_DELIVERY/BANK_TRANSFER/ESEWA/IME_PAY, `paymentReference` (customer transaction id), `currency` (default `npr`; older rows may be `usd`), Stripe ids, shipping snapshot, item price/title snapshots |
| Review                                | 1-5 rating + comment, unique (user, product)                                                                                                                                                                                                                                                                                      |
| Banner                                | Home-page marketing block: `placement` HERO/PROMO_TILE/SIDEBAR, eyebrow/title/titleAccent/highlight/description, `image`, primary + secondary CTA, `theme` key, `sortOrder`, `isActive`                                                                                                                                           |
| Testimonial                           | Customer quote: `quote`, `authorName`, `location`, `rating` 1-5, `avatar`, `sortOrder`, `isActive`                                                                                                                                                                                                                                |
| SiteContentItem                       | Small shell content: `kind` ANNOUNCEMENT/TRUST_BADGE/SOCIAL_LINK/FOOTER_LINK, `group` (footer column), `title`, `subtitle`, `href`, `icon` key, `sortOrder`, `isActive`. Per-kind rules in `lib/validations/content.ts`                                                                                                           |
| SiteSetting                           | Key/value store settings (`contact.*`, `store.*`, `newsletter.blurb`); keys in `lib/content/kinds.ts`, defaults in `lib/brand.ts`                                                                                                                                                                                                 |

Order and payment status transitions are defined once in `lib/orders/status.ts`. The order graph is
payment-method aware: cash on delivery may go PENDING -> SHIPPED and SHIPPED -> CANCELLED, because
the parcel moves before the money does. `hasReservedStock()` there is the single rule for whether an
order is holding inventory.

## 7. Routes Inventory (keep in sync when adding routes)

Pages: `/` (home), `/shop` (catalog: `?q=&category=&sort=&featured=true&onSale=true&page=`), `/products/[slug]`, `/products` (redirects to `/shop`), `/wishlist` (client-side, localStorage), `/cart`, `/checkout`, `/checkout/success`, `/checkout/cancel`, `/sign-in`, `/register`, `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/account/addresses/new`, `/account/addresses/[id]/edit`, `/account/profile`, `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, `/admin/categories`, `/admin/categories/[id]/edit`, `/admin/orders`, `/admin/orders/[id]`, `/admin/customers`, `/admin/banners`, `/admin/banners/new`, `/admin/banners/[id]/edit`, `/admin/testimonials`, `/admin/testimonials/new`, `/admin/testimonials/[id]/edit`, `/admin/content`, `/admin/settings`, plus `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `not-found`, `error`.

| Route                                         | Methods                   | Access                                                                                          |
| --------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `/api/auth/[...nextauth]`                     | GET, POST                 | public                                                                                          |
| `/api/auth/register`                          | POST                      | public (rate limited)                                                                           |
| `/api/products`                               | GET / POST                | public / admin (`featured`, `onSale`, `sort`, `q`, `category`; `includeInactive` admin only)    |
| `/api/products/[id]`                          | GET / PATCH, DELETE       | public / admin (DELETE = soft delete)                                                           |
| `/api/products/[id]/reviews`                  | GET / POST                | public / user (upsert)                                                                          |
| `/api/reviews/[id]`                           | PATCH, DELETE             | owner (delete also admin)                                                                       |
| `/api/categories`                             | GET / POST                | public / admin                                                                                  |
| `/api/categories/[id]`                        | PATCH, DELETE             | admin                                                                                           |
| `/api/cart`                                   | GET, PUT, DELETE          | user                                                                                            |
| `/api/orders`, `/api/orders/[id]`             | GET                       | user (own) / admin any                                                                          |
| `/api/addresses`, `/api/addresses/[id]`       | GET, POST / PATCH, DELETE | user (own)                                                                                      |
| `/api/me`                                     | GET, PATCH                | user                                                                                            |
| `/api/admin/orders`, `/api/admin/orders/[id]` | GET / GET, PATCH          | admin (PATCH takes a status change **or** a manual payment update)                              |
| `/api/upload`                                 | POST (multipart)          | admin                                                                                           |
| `/api/checkout`                               | POST                      | public (rate limited; 503 only when `paymentMethod: "STRIPE"` and Stripe keys are placeholders) |
| `/api/webhooks/stripe`                        | POST                      | Stripe (signature verified; 503 without secret)                                                 |

## 8. Security & Payments

### 8.1 Payment methods

- The catalogue lives in `lib/payments/methods.ts` (pure, client-safe): label, tagline, whether it is
  manual, whether it needs a transaction reference, and the instructions shown to the customer.
  Adding a method means adding a `PaymentMethod` enum value + a config entry there, nothing else.
- **Stripe** is the only _online_ method: `lib/orders/place.ts#startStripeCheckout` creates the order
  and the Checkout Session; stock is decremented when the payment lands (`lib/orders/fulfill.ts`).
  It is hidden from the menu and refused with 503 while the keys are placeholders.
- **Manual methods** (cash on delivery, eSewa, IME Pay, bank transfer) are placed by
  `lib/orders/place.ts#placeManualOrder`: one transaction reserves stock, writes the order and
  empties the server cart. An admin confirms the money later via `updateOrderPaymentStatus`
  (`lib/admin/orders.ts`), which refuses Stripe orders. Cancelling an order that reserved stock
  restocks it.
- Wallet and bank transfers require a customer-supplied `paymentReference`; the admin may correct it
  when verifying. eSewa and IME Pay are _offline confirmation_ flows, not live gateway integrations.

### 8.2 Rules

- The store trades in Nepali rupees: product prices are NPR, new orders record `currency: "npr"` (`ORDER_CURRENCY` in `lib/orders/place.ts`) and Stripe sessions are created in NPR. Historic `usd` orders keep their currency and still format as dollars.
- Never trust prices, totals, or stock from the client. `/api/checkout` re-reads products; `lib/orders/fulfill.ts` is the single idempotent fulfilment path used by both the webhook and `/checkout/success`.
- Verify Stripe webhook signatures; fulfilment is idempotent at the DB level (`updateMany where paymentStatus != PAID`).
- Secrets only via `lib/env.ts`. `.env` is git-ignored; `.env.example` documents every key. Placeholder Stripe keys make payment endpoints return 503 rather than crash.
- Middleware protects `/account/**` and `/admin/**`; layouts and every Server Action / Route Handler re-check the session server-side.
- `callbackUrl`/`redirectTo` values must be relative paths (`/...`, not `//...`).
- Uploads: allow-listed MIME types, 5 MB cap, generated filenames (no user-controlled paths). Local disk only - swap for object storage on serverless.
- React escapes output; the only `dangerouslySetInnerHTML` is the JSON-LD block on the product page (server data via `JSON.stringify`).

## 9. Maintenance Rules for Future Claude Sessions

Before writing code:

1. Read this file, `docs/PROJECT_PLAN.md`, and `docs/RUNBOOK.md`.
2. Inspect `prisma/schema.prisma` before touching any data model.
3. Search `app/api`, `app/<area>/actions.ts`, `lib/<domain>` and `components/` for an existing implementation before creating a new one.

When adding a **route**: follow 4.4, add its Zod schema in `lib/validations/`, add it to section 7 and to `docs/PROJECT_PLAN.md`.
When adding a **model**: follow section 5, create a migration, update section 6, extend `prisma/seed.ts`.
When adding a **component**: decide Server vs. Client first (4.1); shared primitives go in `components/ui/`.
When adding a **dependency**: justify it in the commit message and add it to section 2 if architectural.

After finishing a task:

- Run `npm run check` (typecheck + lint + test) and `npm run build`.
- Update the status tables in `docs/PROJECT_PLAN.md`; update `docs/RUNBOOK.md` if commands, ports or credentials changed.
- Update this file if any rule, folder, route, or model changed.

## 10. Commands

```bash
npm run dev              # dev server on http://localhost:3000
npm run build            # prisma generate + next build
npm run start            # production server
npm run typecheck        # tsc --noEmit
npm run lint             # eslint . --max-warnings=0
npm run test             # vitest run
npm run check            # typecheck + lint + test
docker compose up -d     # PostgreSQL on localhost:5436
npx prisma migrate dev   # create + apply migration
npx prisma migrate deploy# apply pending migrations (CI / returning devs)
npx prisma db seed       # idempotent demo data
npx prisma studio        # DB browser on :5555
```

## 11. Environment Variables (see `.env.example`)

Required: `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`.
Recommended: `AUTH_URL`, `AUTH_TRUST_HOST=true`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
Optional: `RESEND_API_KEY`, `EMAIL_FROM`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
