-- Charitex schema
-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text,
  category text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('IN', 'OUT')),
  quantity integer not null check (quantity > 0),
  date date not null,
  note text,
  unit_price_snapshot numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_tx_user_id on public.stock_transactions(user_id);
create index if not exists idx_tx_product_id on public.stock_transactions(product_id);
create index if not exists idx_tx_date on public.stock_transactions(date);

alter table public.users_profile enable row level security;
alter table public.products enable row level security;
alter table public.stock_transactions enable row level security;

create policy "Users can view own profile" on public.users_profile
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.users_profile
  for insert with check (auth.uid() = id);

create policy "Users can manage own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own transactions" on public.stock_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
