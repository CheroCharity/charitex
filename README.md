# Charitex

Charitex is a full-stack inventory tracking MVP for small and medium businesses. It supports authentication, product management, stock in/out transactions, real-time inventory valuation, and reports.

## Stack

- Next.js (App Router, JavaScript)
- Material UI (MUI)
- Supabase (Auth + Postgres + RLS)

## Features

- Email/password authentication
- Per-user data isolation with Supabase Row-Level Security
- Product CRUD
- Stock in/out transactions
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

4. In Supabase SQL editor, run:
   - `supabase/schema.sql`

5. Start dev server:
   - `npm run dev`

## Business Rules Implemented

- Current stock is computed as:
  - `sum(IN) - sum(OUT)`
- Stock can never go negative (validated before OUT transactions)
- Final stock is never manually stored
- Historical accuracy:
  - each transaction stores `unit_price_snapshot`
  - reports use snapshot value

## Pages

- `/login`
- `/dashboard`
- `/products`
- `/movements`
- `/reports`

## Notes

- Currency display currently uses USD; adjust in formatter if needed.
- Deleting a product removes related transactions via foreign key cascade.
