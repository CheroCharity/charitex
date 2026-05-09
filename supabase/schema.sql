-- Charitex schema (multitenancy + RBAC + activity logs)
-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_frozen boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  business_id uuid references public.businesses(id) on delete restrict,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  is_active boolean not null default true,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.businesses add column if not exists is_frozen boolean;
alter table public.businesses alter column is_frozen set default false;
update public.businesses set is_frozen = false where is_frozen is null;

alter table public.users_profile add column if not exists business_id uuid references public.businesses(id) on delete restrict;
alter table public.users_profile add column if not exists role text;
alter table public.users_profile add column if not exists is_active boolean;
alter table public.users_profile add column if not exists is_super_admin boolean;
alter table public.users_profile alter column role set default 'admin';
alter table public.users_profile alter column is_active set default true;
alter table public.users_profile alter column is_super_admin set default false;
update public.users_profile set role = 'admin' where role is null;
update public.users_profile set is_active = true where is_active is null;
update public.users_profile set is_super_admin = false where is_super_admin is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_profile_role_check'
      and conrelid = 'public.users_profile'::regclass
  ) then
    alter table public.users_profile
      add constraint users_profile_role_check check (role in ('admin', 'staff'));
  end if;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  sku text,
  category text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.products add column if not exists created_by uuid references auth.users(id) on delete set null;
update public.products p
set business_id = up.business_id
from public.users_profile up
where p.user_id = up.id and p.business_id is null;
update public.products set created_by = user_id where created_by is null;

create table if not exists public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('IN', 'OUT')),
  payment_method text,
  quantity integer not null check (quantity > 0),
  date date not null,
  note text,
  unit_price_snapshot numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.stock_transactions add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.stock_transactions add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.stock_transactions add column if not exists payment_method text;
update public.stock_transactions st
set business_id = p.business_id
from public.products p
where st.product_id = p.id and st.business_id is null;
update public.stock_transactions set created_by = user_id where created_by is null;
update public.stock_transactions set payment_method = 'CASH' where type = 'OUT' and payment_method is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stock_transactions_payment_method_check'
      and conrelid = 'public.stock_transactions'::regclass
  ) then
    alter table public.stock_transactions
      add constraint stock_transactions_payment_method_check check (
        (type = 'OUT' and payment_method in ('CASH', 'MPESA'))
        or (type = 'IN' and payment_method is null)
      );
  end if;
end $$;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  entity_table text not null,
  entity_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_profile_business_id on public.users_profile(business_id);
create index if not exists idx_businesses_created_by on public.businesses(created_by);
create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_business_id on public.products(business_id);
create index if not exists idx_tx_user_id on public.stock_transactions(user_id);
create index if not exists idx_tx_business_id on public.stock_transactions(business_id);
create index if not exists idx_tx_product_id on public.stock_transactions(product_id);
create index if not exists idx_tx_date on public.stock_transactions(date);
create index if not exists idx_activity_logs_business_id on public.activity_logs(business_id);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);

create or replace function public.current_user_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.users_profile where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users_profile where id = auth.uid();
$$;

create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(is_super_admin, false) from public.users_profile where id = auth.uid();
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(is_active, false) from public.users_profile where id = auth.uid();
$$;

create or replace function public.current_business_is_frozen()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(b.is_frozen, false)
  from public.users_profile up
  join public.businesses b on b.id = up.business_id
  where up.id = auth.uid();
$$;

alter table public.users_profile enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "Users can view own profile" on public.users_profile;
drop policy if exists "Users can insert own profile" on public.users_profile;
drop policy if exists "Admins can view business users" on public.users_profile;
drop policy if exists "Super admins can view all users" on public.users_profile;
drop policy if exists "Admins can update business users" on public.users_profile;
drop policy if exists "Super admins can update all users" on public.users_profile;
drop policy if exists "Users can manage own products" on public.products;
drop policy if exists "Users can manage own transactions" on public.stock_transactions;
drop policy if exists "Users can view own business" on public.businesses;
drop policy if exists "Admins can update own business" on public.businesses;
drop policy if exists "Super admins can manage businesses" on public.businesses;
drop policy if exists "Users can view own business products" on public.products;
drop policy if exists "Admins can manage business products" on public.products;
drop policy if exists "Super admins can manage all products" on public.products;
drop policy if exists "Users can view own business transactions" on public.stock_transactions;
drop policy if exists "Admins and staff can create allowed transactions" on public.stock_transactions;
drop policy if exists "Admins can update or delete transactions" on public.stock_transactions;
drop policy if exists "Super admins can manage all transactions" on public.stock_transactions;
drop policy if exists "Users can view own business activity logs" on public.activity_logs;
drop policy if exists "Users can insert own activity logs" on public.activity_logs;
drop policy if exists "Super admins can view all activity logs" on public.activity_logs;

create policy "Users can view own profile" on public.users_profile
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.users_profile
  for insert with check (auth.uid() = id);

create policy "Admins can view business users" on public.users_profile
  for select using (
    business_id = public.current_user_business_id()
  );

create policy "Super admins can view all users" on public.users_profile
  for select using (public.current_user_is_super_admin());

create policy "Admins can update business users" on public.users_profile
  for update using (
    public.current_user_role() = 'admin'
    and business_id = public.current_user_business_id()
  ) with check (
    business_id = public.current_user_business_id()
    and role in ('admin', 'staff')
    and coalesce(is_super_admin, false) = false
  );

create policy "Super admins can update all users" on public.users_profile
  for update using (public.current_user_is_super_admin())
  with check (true);

create policy "Users can view own business" on public.businesses
  for select using (id = public.current_user_business_id());

create policy "Admins can update own business" on public.businesses
  for update using (
    id = public.current_user_business_id() and public.current_user_role() = 'admin'
  ) with check (
    id = public.current_user_business_id() and public.current_user_role() = 'admin'
  );

create policy "Super admins can manage businesses" on public.businesses
  for all using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Users can view own business products" on public.products
  for select using (business_id = public.current_user_business_id());

create policy "Admins can manage business products" on public.products
  for all using (
    business_id = public.current_user_business_id() and public.current_user_role() = 'admin'
  ) with check (
    business_id = public.current_user_business_id() and public.current_user_role() = 'admin'
  );

create policy "Super admins can manage all products" on public.products
  for all using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Users can view own business transactions" on public.stock_transactions
  for select using (business_id = public.current_user_business_id());

create policy "Admins and staff can create allowed transactions" on public.stock_transactions
  for insert with check (
    business_id = public.current_user_business_id()
    and (
      public.current_user_role() = 'admin'
      or (public.current_user_role() = 'staff' and type = 'OUT')
    )
  );

create policy "Admins can update or delete transactions" on public.stock_transactions
  for all using (
    business_id = public.current_user_business_id() and public.current_user_role() = 'admin'
  ) with check (
    business_id = public.current_user_business_id() and public.current_user_role() = 'admin'
  );

create policy "Super admins can manage all transactions" on public.stock_transactions
  for all using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Users can view own business activity logs" on public.activity_logs
  for select using (business_id = public.current_user_business_id());

create policy "Users can insert own activity logs" on public.activity_logs
  for insert with check (
    business_id = public.current_user_business_id() and user_id = auth.uid()
  );

create policy "Super admins can view all activity logs" on public.activity_logs
  for select using (public.current_user_is_super_admin());

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_business_id uuid;
  row_id uuid;
  payload_data jsonb;
begin
  if tg_op = 'DELETE' then
    row_business_id := old.business_id;
    row_id := old.id;
    payload_data := jsonb_build_object(
      'before', to_jsonb(old)
    );
  elsif tg_op = 'UPDATE' then
    row_business_id := new.business_id;
    row_id := new.id;
    payload_data := jsonb_build_object(
      'before', to_jsonb(old),
      'after', to_jsonb(new),
      'changed_fields', (
        select coalesce(jsonb_object_agg(n.key, n.value), '{}'::jsonb)
        from jsonb_each(to_jsonb(new)) n
        join jsonb_each(to_jsonb(old)) o on n.key = o.key
        where n.value is distinct from o.value
      )
    );
  else
    row_business_id := new.business_id;
    row_id := new.id;
    payload_data := jsonb_build_object(
      'after', to_jsonb(new)
    );
  end if;

  if row_business_id is null then
    return coalesce(new, old);
  end if;

  insert into public.activity_logs (business_id, user_id, entity_table, entity_id, action, payload)
  values (
    row_business_id,
    auth.uid(),
    tg_table_name,
    row_id,
    tg_op,
    payload_data
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_products_activity_log on public.products;
create trigger trg_products_activity_log
  after insert or update or delete on public.products
  for each row execute function public.log_activity();

drop trigger if exists trg_stock_tx_activity_log on public.stock_transactions;
create trigger trg_stock_tx_activity_log
  after insert or update or delete on public.stock_transactions
  for each row execute function public.log_activity();

do $$
declare
  r record;
  generated_business_id uuid;
begin
  for r in
    select id, email
    from public.users_profile
    where business_id is null
  loop
    insert into public.businesses (name, created_by)
    values (coalesce(split_part(r.email, '@', 1), 'Business') || ' Business', r.id)
    returning id into generated_business_id;

    update public.users_profile
    set business_id = generated_business_id,
        role = coalesce(role, 'admin')
    where id = r.id;
  end loop;
end $$;

create or replace function public.set_business_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_business_id uuid;
  actor_role text;
  actor_super boolean;
  target_business_id uuid;
begin
  if new_role not in ('admin', 'staff') then
    raise exception 'Invalid role: %', new_role;
  end if;

  select business_id, role, coalesce(is_super_admin, false)
  into actor_business_id, actor_role, actor_super
  from public.users_profile
  where id = auth.uid();

  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if actor_business_id is null and not coalesce(actor_super, false) then
    raise exception 'Your account is not assigned to a business.';
  end if;

  if not coalesce(actor_super, false) and actor_role <> 'admin' then
    raise exception 'Only admins can assign roles.';
  end if;

  select business_id
  into target_business_id
  from public.users_profile
  where id = target_user_id;

  if target_business_id is null then
    raise exception 'Target user not found.';
  end if;

  if not coalesce(actor_super, false) and target_business_id <> actor_business_id then
    raise exception 'You can only update users in your business.';
  end if;

  update public.users_profile
  set role = new_role
  where id = target_user_id;

  insert into public.activity_logs (business_id, user_id, entity_table, entity_id, action, payload)
  values (
    target_business_id,
    auth.uid(),
    'users_profile',
    target_user_id,
    'UPDATE',
    jsonb_build_object('role', new_role)
  );
end;
$$;

create or replace function public.set_user_active_status(target_user_id uuid, make_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_business_id uuid;
  actor_role text;
  actor_super boolean;
  target_business_id uuid;
  target_is_super boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select business_id, role, coalesce(is_super_admin, false)
  into actor_business_id, actor_role, actor_super
  from public.users_profile
  where id = auth.uid();

  if actor_business_id is null and not coalesce(actor_super, false) then
    raise exception 'Your account is not assigned to a business.';
  end if;

  if not coalesce(actor_super, false) and actor_role <> 'admin' then
    raise exception 'Only admins can activate/deactivate users.';
  end if;

  select business_id, coalesce(is_super_admin, false)
  into target_business_id, target_is_super
  from public.users_profile
  where id = target_user_id;

  if target_business_id is null then
    raise exception 'Target user not found.';
  end if;

  if target_is_super then
    raise exception 'Super admin users cannot be activated/deactivated from this action.';
  end if;

  if not coalesce(actor_super, false) and target_business_id <> actor_business_id then
    raise exception 'You can only manage users in your business.';
  end if;

  update public.users_profile
  set is_active = make_active
  where id = target_user_id;

  insert into public.activity_logs (business_id, user_id, entity_table, entity_id, action, payload)
  values (
    target_business_id,
    auth.uid(),
    'users_profile',
    target_user_id,
    'UPDATE',
    jsonb_build_object('is_active', make_active)
  );
end;
$$;

create or replace function public.set_business_frozen_status(target_business_id uuid, freeze_business boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_super boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select coalesce(is_super_admin, false)
  into actor_super
  from public.users_profile
  where id = auth.uid();

  if not coalesce(actor_super, false) then
    raise exception 'Only super admins can freeze/unfreeze businesses.';
  end if;

  update public.businesses
  set is_frozen = freeze_business
  where id = target_business_id;

  if not found then
    raise exception 'Business not found.';
  end if;

  insert into public.activity_logs (business_id, user_id, entity_table, entity_id, action, payload)
  values (
    target_business_id,
    auth.uid(),
    'businesses',
    target_business_id,
    'UPDATE',
    jsonb_build_object('is_frozen', freeze_business)
  );
end;
$$;

create or replace function public.super_admin_create_business_admin(target_email text, business_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_super boolean;
  target_user_id uuid;
  new_business_id uuid;
begin
  select coalesce(is_super_admin, false)
  into actor_super
  from public.users_profile
  where id = auth.uid();

  if not coalesce(actor_super, false) then
    raise exception 'Only super admin can create business admins.';
  end if;

  select id
  into target_user_id
  from public.users_profile
  where lower(email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    raise exception 'User with email % not found. Ask them to sign up first.', target_email;
  end if;

  insert into public.businesses (name, created_by)
  values (business_name, auth.uid())
  returning id into new_business_id;

  update public.users_profile
  set business_id = new_business_id,
      role = 'admin'
  where id = target_user_id;

  insert into public.activity_logs (business_id, user_id, entity_table, entity_id, action, payload)
  values (
    new_business_id,
    auth.uid(),
    'users_profile',
    target_user_id,
    'UPDATE',
    jsonb_build_object('role', 'admin', 'business_id', new_business_id)
  );

  return new_business_id;
end;
$$;

create or replace function public.super_admin_onboard_business(
  business_name text,
  admin_email text,
  staff_emails text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_super boolean;
  admin_user_id uuid;
  staff_email text;
  staff_user_id uuid;
  new_business_id uuid;
begin
  select coalesce(is_super_admin, false)
  into actor_super
  from public.users_profile
  where id = auth.uid();

  if not coalesce(actor_super, false) then
    raise exception 'Only super admin can onboard businesses.';
  end if;

  if business_name is null or btrim(business_name) = '' then
    raise exception 'Business name is required.';
  end if;

  select id
  into admin_user_id
  from public.users_profile
  where lower(email) = lower(admin_email)
  limit 1;

  if admin_user_id is null then
    raise exception 'Admin user with email % not found. Ask them to sign up first.', admin_email;
  end if;

  insert into public.businesses (name, created_by)
  values (business_name, auth.uid())
  returning id into new_business_id;

  update public.users_profile
  set business_id = new_business_id,
      role = 'admin'
  where id = admin_user_id;

  insert into public.activity_logs (business_id, user_id, entity_table, entity_id, action, payload)
  values (
    new_business_id,
    auth.uid(),
    'users_profile',
    admin_user_id,
    'UPDATE',
    jsonb_build_object('role', 'admin', 'business_id', new_business_id)
  );

  foreach staff_email in array coalesce(staff_emails, '{}'::text[])
  loop
    if staff_email is null or btrim(staff_email) = '' then
      continue;
    end if;

    select id
    into staff_user_id
    from public.users_profile
    where lower(email) = lower(staff_email)
    limit 1;

    if staff_user_id is null then
      raise exception 'Staff user with email % not found. Ask them to sign up first.', staff_email;
    end if;

    update public.users_profile
    set business_id = new_business_id,
        role = 'staff'
    where id = staff_user_id;

    insert into public.activity_logs (business_id, user_id, entity_table, entity_id, action, payload)
    values (
      new_business_id,
      auth.uid(),
      'users_profile',
      staff_user_id,
      'UPDATE',
      jsonb_build_object('role', 'staff', 'business_id', new_business_id)
    );
  end loop;

  return new_business_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  skip_default_business boolean;
  new_business_id uuid;
begin
  skip_default_business := coalesce((new.raw_user_meta_data ->> 'skip_default_business')::boolean, false);

  if skip_default_business then
    insert into public.users_profile (id, email, role, is_active)
    values (new.id, new.email, 'staff', true)
    on conflict (id) do update set email = excluded.email;
    return new;
  end if;

  insert into public.businesses (name, created_by)
  values (coalesce(split_part(new.email, '@', 1), 'Business') || ' Business', new.id)
  returning id into new_business_id;

  insert into public.users_profile (id, email, business_id, role, is_active)
  values (new.id, new.email, new_business_id, 'admin', true)
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
