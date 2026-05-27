# Charitex

Charitex is a full-stack inventory tracking MVP for small and medium businesses. It supports authentication, product management, stock in/out transactions, real-time inventory valuation, and reports.

## Stack

- Next.js (App Router, JavaScript)
- Material UI (MUI)
- Supabase (Auth + Postgres + RLS)

## Features

- Email/password authentication
- Multi-tenant business model (users are scoped to one business)
- Role-based access control (admin, staff)
- Super admin capabilities for cross-business user and business control
- Admin/super-admin user onboarding (no self-signup)
- User activation/deactivation controls
- Business freeze/unfreeze controls
- Per-user data isolation with Supabase Row-Level Security
- Product CRUD
- Stock in/out transactions
- Activity logs for product and stock transaction changes
- Payment method capture for stock out (`CASH`, `M-PESA`)
- Derived stock logic from transaction history only
- Dashboard metrics:
  - total inventory value
  - total products
  - recent stock movements
  - low-stock count
- Reports with date filters and CSV export
- Responsive admin layout with sidebar

## Project Structure

- `src/app` - routes (App Router)
- `src/components` - reusable UI components
- `src/services` - Supabase data services
- `src/utils` - inventory calculations
- `src/contexts` - auth context/provider
- `supabase/schema.sql` - database schema and RLS policies

## Setup

1. Install dependencies:
   - `npm install`

2. Copy environment file:
   - copy `.env.local.example` to `.env.local`

3. Set values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for admin onboarding API route)
   - `SUPABASE_JWT_SECRET` (optional, used only as local fallback if your machine cannot validate Supabase TLS certificates)

   If you see local server errors such as `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` while validating tokens, either:
   - trust your corporate/local root CA via `NODE_EXTRA_CA_CERTS`, or
   - set `SUPABASE_JWT_SECRET` (Project Settings -> API -> JWT Secret) for local JWT verification fallback.

4. In Supabase SQL editor, run:
   - `supabase/schema.sql`

5. Start dev server:
   - `npm run dev`

## Business Rules Implemented

- Current stock is computed as:
  - `sum(IN) - sum(OUT)`
- Stock can never go negative (validated before OUT transactions)
- Final stock is never manually stored
- Staff users can only create `OUT` transactions
- Admin users can manage products and all transaction types
- Historical accuracy:
  - each transaction stores `unit_price_snapshot`
  - reports use snapshot value
- Dashboard shows `Cash In` and `M-PESA In` totals for selected period (default: current month)

## Pages

- `/login`
- `/dashboard`
- `/products`
- `/movements`
- `/reports`
- `/activity-logs`
- `/team` (business admin)
- `/team` (business admin + super admin)
- `/super-admin` (super admin)

## Notes

- Currency display uses Kenyan Shilling (KES).
- Deleting a product removes related transactions via foreign key cascade.
