# E-Store (Vipul Project)

A full-stack e-commerce demo.

## Stack

- Backend: Node.js, Express.js
- DB Layer: MySQL (mysql2) with Sequelize models plus optimized raw SQL queries
- Auth: JWT (httpOnly cookie sessions)
- Email: Nodemailer (Ethereal for dev)
- Frontend: Static HTML/CSS/JS (Material Design Lite + custom theme)

## Features

- Product catalog with search, filters, pagination
- Cart & checkout with order creation (transactional)
- Reviews with helpfulness metrics
- Admin dashboard: manage products, reviews, orders (status workflow)
- Analytics endpoints: top selling, category stats

## Structure

```
backend/
  app.js
  config/env.js
  Database/
  controllers/
  routes/
  middleware/
  models/
  scripts/
  services/
frontend/
  public/
```

## Requirements

- Node.js 18+
- MySQL 8+

## Setup

1) Install

```bash
npm --prefix backend install
```

2) Environment

```bash
copy backend/.env.example backend/.env
```

Notes:
- `.env` is not committed to version control. Each user must create their own.
- Required keys (see `.env.example`):
  - `DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME`
  - `JWT_SECRET, JWT_EXPIRES_IN`
  - Optional: `DB_SYNC_FORCE, DB_SYNC_ALTER, SMTP_*`

3) Start

```bash
# from backend/
node app.js
```

## How components are linked

- Server and static UI
  - `backend/app.js` starts Express, serves `frontend/public` and mounts APIs under `/api` and `/api/admin`.
  - Opening `/` loads `frontend/public/index.html` and other pages like `products.html`, `admin.html`.

- Auth and middleware
  - `POST /api/auth/login` issues a JWT stored in an httpOnly cookie.
  - `middleware/auth.js` verifies the cookie and sets `req.user`.
  - `middleware/adminAuth.js` restricts admin routes.

- Database access
  - `Database/index.js` sets up Sequelize models and relations.
  - `Database/database.js` provides a mysql2 pool for raw SQL.
  - `Database/queries.js` contains optimized queries used by services/controllers.

- APIs
  - Public routes: `routes/*.js` → `controllers/*` (cart, orders, reviews, auth, search).
  - Admin routes: `routes/admin/*.js` → `controllers/admin/*` (products, reviews, orders).
  - Analytics: `routes/analyticsRoutes.js` → `controllers/analyticsController.js` → `services/analyticsService.js` → `Database/queries.js`.

- Frontend integration
  - Pages fetch data from the API (e.g., product lists, cart count, login). `admin.html` manages tables and updates order status via `/api/admin/orders/:id/status`.

## Seed (optional)

```bash
node ./scripts/createAdminUser.js
node ./scripts/populateProducts.js
```

## Admin

- Sign in and open `/admin.html`.
- Orders support status updates: processing, in_transit, out_for_delivery, delivered.

## Notes

- Cookies are `httpOnly` and `secure` in production.
- Passwords are hashed via Sequelize hooks.
- Email uses Ethereal in dev; configure SMTP for production.

