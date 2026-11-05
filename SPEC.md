# Statlume spec

Practice project. Statlume is a fictional brand created to show my development skills. It is not a real business and is not linked to any client work.

## 1. Goal

A store analytics dashboard for a fictional shop, Halden Goods. It shows revenue, orders, products and customers for any date range, with role-based access and CSV export. The point of the project is hand-written SQL that is correct, fast and explained.

## 2. Users

| Role   | Can do                                                                |
| ------ | --------------------------------------------------------------------- |
| Admin  | Everything a viewer can, plus manage users (add, remove, change role) |
| Viewer | View every report, change filters, export CSV                         |

No public sign-up. The seed creates one admin and one viewer. The login page has "Try as admin" and "Try as viewer" buttons.

## 3. Stack

| Layer     | Choice                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| Monorepo  | pnpm workspaces: `apps/web`, `apps/api`, `packages/shared`                            |
| Front end | Next.js (App Router), TypeScript strict, Tailwind v4, charts drawn as server-side SVG |
| API       | Node.js, Express 5, TypeScript strict, zod, `mysql2` (no ORM)                         |
| Database  | MySQL 8.4 LTS in Docker Compose                                                       |
| Auth      | argon2, JWT access + refresh tokens in httpOnly cookies                               |
| Fonts     | Archivo 400/600/800, self-hosted (Latin subset)                                       |
| CI        | GitHub Actions: format, lint, typecheck, build                                        |

Next.js rewrites `/api/*` to the Express API so the browser only sees one origin (no CORS, cookies keep working on Vercel + Render later).

## 4. Pages

| Route        | Content                                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` Landing  | Public product page: what each report answers, how to read the colours, the time zone rule, how it is built, one-click demo                        |
| `/login`     | Email + password form, two demo buttons                                                                                                            |
| `/overview`  | KPI cards (revenue, orders, AOV, returning customer rate) with change vs previous period; revenue and orders charts over time (day / week / month) |
| `/products`  | Top products table: units, revenue, refunds, share of revenue. Sort, search, CSV                                                                   |
| `/customers` | New vs returning over time, repeat purchase rate, top customers table, CSV                                                                         |
| `/orders`    | Paginated order list, filter by status and channel, CSV                                                                                            |
| `/users`     | Admin only. List, add, remove, change role                                                                                                         |

Shared: date range picker in the top bar (7d, 30d, 90d, this year, last 12 months, custom), stored in the URL as `?from=YYYY-MM-DD&to=YYYY-MM-DD`. All times in store time (America/New_York), noted in the UI.

States on every section: skeleton loading (Suspense), empty state with reset, error with retry, "Waking up the server" after 3 s.

Footer on every page: "Practice project. Statlume is a fictional brand created to show my development skills. It is not a real business and is not linked to any client work." plus the current year set by code.

## 5. Data model

All timestamps are `DATETIME` in UTC. Money is `DECIMAL(10,2)`.

| Table              | Key columns                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `users`            | id, email (unique), name, password_hash, role (`admin`/`viewer`), created_at                                                         |
| `refresh_tokens`   | id, user_id, token_hash (unique), family_id, expires_at, revoked_at, created_at                                                      |
| `customers`        | id, email, first_name, last_name, city, created_at                                                                                   |
| `products`         | id, title, category, created_at                                                                                                      |
| `product_variants` | id, product_id, title, sku, price                                                                                                    |
| `orders`           | id, customer_id, channel (`online`/`mobile`/`social`), status (`paid`/`refunded`/`cancelled`), subtotal, discount, total, created_at |
| `order_items`      | id, order_id, variant_id, quantity, unit_price                                                                                       |
| `refunds`          | id, order_id, amount, created_at                                                                                                     |

Indexes from the start: foreign keys, `customers(email)`. The `orders(status, created_at)` index is added in its own migration as part of the index story.

### Seed

- Fixed random seed, so every run gives the same data.
- About 40 products in 5 categories, 1 to 3 variants each.
- About 3,500 customers, about 30% buy more than once.
- About 10,000 orders over the last 12 months up to today. Holiday peak in Nov and Dec, busier weekends, small upward trend.
- About 3% refunded, about 1% cancelled.
- `pnpm seed --orders=500000` for the index story.
- Seed runs automatically on first `pnpm dev` if the database is empty.

## 6. API routes

All under `/api`. All inputs validated with zod. All SQL parameterised.

| Method | Route                    | Role   | Notes                                                                         |
| ------ | ------------------------ | ------ | ----------------------------------------------------------------------------- |
| POST   | `/auth/login`            | public | Rate limit 5/min per IP                                                       |
| POST   | `/auth/demo`             | public | Body `{ role }`, logs in a demo account                                       |
| POST   | `/auth/refresh`          | cookie | Rotates refresh token, reuse revokes the family                               |
| POST   | `/auth/logout`           | user   | Revokes refresh token, clears cookies                                         |
| GET    | `/auth/me`               | user   | Current user                                                                  |
| GET    | `/reports/kpis`          | user   | `from`, `to`; current and previous period                                     |
| GET    | `/reports/sales`         | user   | `from`, `to`, `interval` (day/week/month); revenue + orders series            |
| GET    | `/reports/products`      | user   | `from`, `to`, `sort`, `q`, `limit`                                            |
| GET    | `/reports/customers`     | user   | `from`, `to`; new vs returning series, repeat rate                            |
| GET    | `/reports/top-customers` | user   | `from`, `to`, `limit`                                                         |
| GET    | `/orders`                | user   | `from`, `to`, `status`, `channel`, `page`, `pageSize`                         |
| GET    | `/export/:report.csv`    | user   | `orders`, `products`, `customers`; streamed; CSV injection safe; rate limited |
| GET    | `/users`                 | admin  |                                                                               |
| POST   | `/users`                 | admin  |                                                                               |
| PATCH  | `/users/:id`             | admin  | Change role or name; cannot demote the last admin                             |
| DELETE | `/users/:id`             | admin  | Cannot delete yourself                                                        |
| GET    | `/health`                | public | Used by the "waking up" check                                                 |

Security: Helmet, strict CORS (same origin), cookies `httpOnly` + `Secure` (prod) + `SameSite=Lax`, rate limiting on auth and export.

## 7. Hosting

Local only for now. One command: `pnpm dev` (starts MySQL in Docker, runs migrations, seeds if empty, starts API and web). `DEPLOY.md` documents the later setup: web on Vercel, API on Render (sleeps after 15 min idle), MySQL on Aiven (one service, one database per project).

## 8. Task checklist

### Setup

- [ ] pnpm monorepo, TypeScript strict, ESLint, Prettier, `.editorconfig`
- [ ] Docker Compose with MySQL 8.4, time zone tables loaded
- [ ] `.env.example` for web and api, `.gitignore`
- [ ] Public GitHub repo `practice-statlume`, first push
- [ ] GitHub Actions CI

### Database

- [ ] Migration runner and `001_init.sql`
- [ ] Seed script with fixed seed, 10k orders, `--orders` flag
- [ ] Auto seed on first start

### API

- [ ] Express app: Helmet, JSON, cookie parser, error handler, zod validation
- [ ] Auth: login, demo login, refresh with rotation and reuse detection, logout, me
- [ ] `requireAuth` and `requireRole` middleware, rate limiting
- [ ] Report queries: KPIs with previous period, sales series, products, customers, top customers (store time zone)
- [ ] Orders list with filters and pagination
- [ ] Streaming CSV export with injection escaping
- [ ] Users CRUD with the last-admin and self-delete guards

### Web

- [ ] Fonts, Tailwind tokens from the brand book, favicon and manifest from `mark.svg`
- [ ] Layout: sidebar, top bar with date picker, mobile menu with focus trap, footer
- [ ] Login page with demo buttons, route protection, `/api` rewrite
- [ ] Overview: KPI cards and charts
- [ ] Products, Customers, Orders pages
- [ ] Users page (admin)
- [ ] Skeleton, empty, error and waking-up states
- [ ] Metadata per page, `robots.txt` (noindex for app pages), sitemap

### Index story

- [ ] Measure revenue-by-day on 500k orders with `EXPLAIN ANALYZE` before and after `orders(status, created_at)`
- [ ] Write `docs/INDEX_STORY.md` with real timings and plans

### QA, docs, wrap-up

- [ ] QA Phase 1 at 9 screen sizes, `docs/QA-PHASE-1.md`, screenshots
- [ ] QA Phase 2: Lighthouse, a11y, bundle size, code checks
- [ ] `README.md`, `DEPLOY.md`, `CASE_STUDY.md`, `docs/CREDITS.md`
- [ ] Desktop and mobile screenshots in `docs/screenshots`
- [ ] Update root `PROGRESS.md`
