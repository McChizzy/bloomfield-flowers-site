-- Bloomfield Flowers — order database schema
-- Run this in your Supabase SQL editor (https://app.supabase.com → SQL Editor)

create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  transaction_ref  text unique not null,
  status           text not null default 'initiated',

  -- customer
  customer_name    text,
  customer_email   text,
  customer_phone   text,
  recipient_name   text,
  recipient_phone  text,

  -- delivery
  delivery_city    text,
  delivery_area    text,
  delivery_address text,
  delivery_date    text,
  delivery_time    text,
  card_message     text,
  delivery_notes   text,

  -- financials (amounts in Naira)
  subtotal         integer,
  delivery_fee     integer,
  discount_code    text,
  discount_amount  integer default 0,
  total            integer,

  -- line items snapshot
  items            jsonb,

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Speed up webhook lookups by transaction_ref
create index if not exists orders_transaction_ref_idx on orders(transaction_ref);

-- Keep updated_at current on every update
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- Optional: view of confirmed orders for quick admin lookup
create or replace view confirmed_orders as
  select
    id,
    transaction_ref,
    customer_name,
    customer_email,
    customer_phone,
    delivery_city,
    delivery_area,
    delivery_address,
    delivery_date,
    delivery_time,
    card_message,
    delivery_notes,
    subtotal,
    delivery_fee,
    discount_code,
    discount_amount,
    total,
    items,
    created_at
  from orders
  where status = 'success'
  order by created_at desc;

-- Custom order & contact form inquiries
create table if not exists inquiries (
  id         uuid primary key default gen_random_uuid(),
  form_type  text not null default 'contact',
  name       text,
  email      text,
  phone      text,
  instagram  text,
  occasion   text,
  colors     text,
  budget     text,
  message    text,
  created_at timestamptz default now()
);

create index if not exists inquiries_form_type_idx on inquiries(form_type);
create index if not exists inquiries_created_at_idx on inquiries(created_at desc);

-- Discount codes
create table if not exists discount_codes (
  id                       uuid primary key default gen_random_uuid(),
  code                     text unique not null,
  type                     text not null default 'percent', -- 'percent' | 'fixed'
  value                    numeric not null,                -- percent (5) or fixed naira amount
  free_delivery_threshold  integer,                        -- null = no free delivery; integer = min subtotal (naira) for free delivery
  min_order                integer not null default 0,
  max_uses                 integer,                        -- null = unlimited
  uses                     integer not null default 0,
  expires_at               timestamptz,
  active                   boolean not null default true,
  created_at               timestamptz default now()
);

-- Girlfriend's Day campaign code
insert into discount_codes (code, type, value, free_delivery_threshold, min_order, expires_at, active)
values ('GFDAY5', 'percent', 5, 250000, 0, '2026-08-02 23:59:59+00', true)
on conflict (code) do nothing;

-- Migration: add discount columns to existing orders table if not present
alter table orders add column if not exists discount_code   text;
alter table orders add column if not exists discount_amount integer default 0;

-- Atomic increment for discount code usage (called by webhook on confirmed payment)
create or replace function increment_discount_uses(p_code text)
returns void language sql security definer as $$
  update discount_codes set uses = uses + 1 where code = p_code;
$$;
