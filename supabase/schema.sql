create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'customer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists role text not null default 'customer';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'admin'));

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at on public.profiles;
create trigger set_profile_updated_at
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  image_url text not null,
  stock integer not null default 0 check (stock >= 0)
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'products'
    ) then
    alter publication supabase_realtime add table public.products;
  end if;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'Pending'
    check (status in ('Pending', 'Paid', 'Confirmed', 'Shipped', 'Declined', 'Cancellation Pending')),
  eta date,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'orders'
    ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;

alter table public.orders enable row level security;

revoke all on table public.orders from anon, authenticated;
grant select, update (status, eta) on table public.orders to authenticated;

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
  on public.orders for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.place_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_items jsonb
)
returns table (id uuid, order_number bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_line record;
  product_title text;
  product_price numeric(12, 2);
  product_stock integer;
  order_items jsonb := '[]'::jsonb;
  order_total numeric(12, 2) := 0;
begin
  if nullif(btrim(p_customer_name), '') is null
    or nullif(btrim(p_customer_email), '') is null
    or nullif(btrim(p_customer_phone), '') is null then
    raise exception 'Customer name, email, and phone are required.' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'An order must contain between 1 and 50 items.' using errcode = '22023';
  end if;

  for order_line in
    select product_id, quantity
    from jsonb_to_recordset(p_items) as requested(product_id uuid, quantity integer)
  loop
    if order_line.product_id is null or order_line.quantity is null
      or order_line.quantity < 1 or order_line.quantity > 20 then
      raise exception 'Order item quantity is invalid.' using errcode = '22023';
    end if;

    select product.title, product.price, product.stock
    into product_title, product_price, product_stock
    from public.products as product
    where product.id = order_line.product_id
    for update;

    if not found then
      raise exception 'An item in this order is no longer available.' using errcode = '22023';
    end if;
    if product_stock < order_line.quantity then
      raise exception 'There is not enough stock for %.', product_title using errcode = '22023';
    end if;

    update public.products
    set stock = stock - order_line.quantity
    where public.products.id = order_line.product_id;

    order_total := order_total + product_price * order_line.quantity;
    order_items := order_items || jsonb_build_array(jsonb_build_object(
      'productId', order_line.product_id,
      'title', product_title,
      'quantity', order_line.quantity,
      'unitPrice', product_price
    ));
  end loop;

  return query
  insert into public.orders as created (customer_name, customer_email, customer_phone, items, amount)
  values (btrim(p_customer_name), btrim(p_customer_email), btrim(p_customer_phone), order_items, order_total)
  returning created.id, created.order_number;
end;
$$;

revoke all on function public.place_order(text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, jsonb) to anon, authenticated;

alter table public.products enable row level security;

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

drop policy if exists "Products are publicly readable" on public.products;
create policy "Products are publicly readable"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using ((select public.is_admin()));

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- After creating an admin user in Supabase Auth, promote its profile in the SQL editor:
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@example.com');
