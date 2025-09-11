# E-Store
 A backend focused full-stack e-commerce web app .

![JavaScript](https://badgen.net/badge/JavaScript/ES6+/yellow?icon=javascript)
![HTML5](https://badgen.net/badge/HTML/5/orange?icon=html5)
![Node.js](https://badgen.net/badge/Node.js/18+/green?icon=node-dot-js)
![Express](https://badgen.net/badge/Express/4.x/blue?icon=express)
![JWT](https://badgen.net/badge/JWT/Supported/orange?icon=jsonwebtokens)
![MySQL](https://badgen.net/badge/MySQL/8.0+/blue?icon=mysql)
![Sequelize](https://badgen.net/badge/Sequelize/6.x/blue?icon=sequelize)
![Nodemailer](https://badgen.net/badge/Nodemailer/Supported/green?icon=npm)


## Features

- Product catalog with search, filters, pagination
- Cart & checkout with order creation 
- Reviews with helpfulness metrics 
- JWT Based User Authentication and Email Password Recovery 
- Admin dashboard: manage products, reviews, orders , check category wise statistics

## Demonstration 
### Main Page

![Main1-ezgif com-reverse](https://github.com/user-attachments/assets/3e2a7980-3410-4602-b130-6ebc06e06bf4)



### ADMIN Portal
![Untitledvideo-MadewithClipchamp-ezgif com-reverse](https://github.com/user-attachments/assets/33670851-b7df-4dda-9217-e522bb86c998)



### Product Details 
![ProdDetailsInfinite-ezgif com-reverse](https://github.com/user-attachments/assets/02859205-c18e-40b6-b1a3-a0be9f243afb)

### Successfull Order 
<img width="1280" height="720" alt="order_1280x720" src="https://github.com/user-attachments/assets/72db90b8-90b9-4fd8-befb-0275e94e249a" />


### User Dashboard
<img width="1280" height="720" alt="Dash_1280x720" src="https://github.com/user-attachments/assets/62a88233-ef49-42fa-bcd3-0a7c2036acfa" />








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
cd backend
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
    

## Admin

- Sign in and open `/admin.html`.
- Orders support status updates: processing, in_transit, out_for_delivery, delivered.

## Notes

- Cookies are `httpOnly` and `secure` in production.
- Passwords are hashed via Sequelize hooks.
- Email uses Ethereal in dev; configure SMTP for production.

