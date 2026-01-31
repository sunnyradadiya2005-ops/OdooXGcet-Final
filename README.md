# KirayaKart - Rental Management System

A full-stack ERP-style rental platform with frontend, backend, database, authentication, payments, and reporting.

## Tech Stack

- **Frontend:** React, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Neon DB) with Prisma
- **Auth:** JWT, bcrypt, Nodemailer (email verification, password reset)
- **Payments:** Razorpay (test mode)

## Project Structure

```
KirayaKart/
├── client/
│   └── vite-project/     # React frontend
├── backend/              # Express API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── routes/
│       ├── middleware/
│       ├── utils/
│       └── index.js
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon DB recommended)
- Razorpay test account (optional, for payments)

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create `.env` from `.env.example` and configure:

- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `JWT_SECRET` - A secure random string
- `SMTP_*` - Email config (use [Ethereal](https://ethereal.email) for testing)
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - From [Razorpay Dashboard](https://dashboard.razorpay.com) (test mode)

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Backend runs on http://localhost:5000

### 2. Frontend

```bash
cd client/vite-project
npm install
npm run dev
```

Frontend runs on http://localhost:5173 (proxies /api to backend)

## Demo Accounts (after seed)

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@kirayakart.com   | Password123 |
| Customer| customer@kirayakart.com| Password123 |
| Vendor  | vendor@kirayakart.com  | Password123 |

## User Roles

- **Customer** - Browse products, add to cart, checkout, view orders
- **Vendor** - ERP dashboard, manage orders, products, invoices, reports
- **Admin** - Full access, vendor earnings report

## Key Flows

### Customer
1. Browse products (filters: brand, color, price)
2. Add to cart with rental dates
3. Express checkout (address, delivery method)
4. Payment via Razorpay
5. Order confirmation

### Rental Order Flow
Quotation → Rental Order → Confirmed → Picked Up → Returned → Invoice → Payment

### ERP (Vendor/Admin)
- **Orders** - Kanban view, List view, status transitions (Confirm, Pickup, Return)
- **Invoices** - Create from order, Post, Register payment
- **Reports** - Revenue chart, most rented products, vendor earnings (Admin)

## API Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register/customer` - Customer signup
- `POST /api/auth/register/vendor` - Vendor signup
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset with token
- `GET /api/products` - List products (filters, pagination)
- `GET /api/products/:id` - Product detail
- `GET /api/cart` - Cart items (auth)
- `POST /api/cart` - Add to cart (auth)
- `POST /api/orders/from-cart` - Create order from cart (auth)
- `GET /api/orders` - List orders (auth, filtered by role)
- `GET /api/orders/kanban` - Kanban data (vendor/admin)
- `PATCH /api/orders/:id/status` - Update status
- `POST /api/orders/:id/pickup` - Confirm pickup
- `POST /api/orders/:id/return` - Confirm return
- `GET /api/invoices` - List invoices
- `POST /api/invoices/from-order/:orderId` - Create invoice
- `POST /api/payments/create-order` - Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/most-rented` - Most rented products

## Environment Variables

See `backend/.env.example` for full list.

## License

MIT
