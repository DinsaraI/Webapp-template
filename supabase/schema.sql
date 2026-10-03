create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text,
  phone_number text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists phone_number text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone'
  ) then
    execute 'update public.profiles set phone_number = phone where phone_number is null and phone is not null';
  end if;
end;
$$;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null and btrim(username) <> '';

alter table public.profiles
  drop constraint if exists profiles_username_format_check;

alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or btrim(username) = '' or username ~ '^[A-Za-z0-9_.-]{3,30}$');

alter table public.profiles
  add column if not exists role text not null default 'customer';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'admin'));

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, full_name, username, phone_number) on table public.profiles to authenticated;
grant update (full_name, username, phone_number) on table public.profiles to authenticated;

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

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create table if not exists public.shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_name text not null,
  phone_number text not null,
  street_address text not null,
  city text not null,
  postal_code text not null,
  country text not null default 'Sri Lanka',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists shipping_addresses_one_default_per_user
  on public.shipping_addresses (user_id)
  where is_default;

create index if not exists shipping_addresses_user_created_idx
  on public.shipping_addresses (user_id, created_at desc);

alter table public.shipping_addresses enable row level security;
revoke all on table public.shipping_addresses from anon, authenticated;
grant select, insert, update, delete on table public.shipping_addresses to authenticated;

drop policy if exists "Users can read their own shipping addresses" on public.shipping_addresses;
create policy "Users can read their own shipping addresses"
  on public.shipping_addresses for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own shipping addresses" on public.shipping_addresses;
create policy "Users can create their own shipping addresses"
  on public.shipping_addresses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own shipping addresses" on public.shipping_addresses;
create policy "Users can update their own shipping addresses"
  on public.shipping_addresses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own shipping addresses" on public.shipping_addresses;
create policy "Users can delete their own shipping addresses"
  on public.shipping_addresses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'street'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'city'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'state'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'province'
  ) then
    execute $migration$
      insert into public.shipping_addresses (
        user_id, recipient_name, phone_number, street_address, city, postal_code, country, is_default
      )
      select
        profile.id,
        coalesce(nullif(btrim(profile.full_name), ''), 'Recipient'),
        coalesce(nullif(btrim(profile.phone_number), ''), ''),
        concat_ws(', ', nullif(btrim(profile.street), ''), nullif(btrim(profile.state), ''), nullif(btrim(profile.province), '')),
        btrim(profile.city),
        '',
        'Sri Lanka',
        true
      from public.profiles as profile
      where nullif(btrim(profile.street), '') is not null
        and nullif(btrim(profile.city), '') is not null
        and not exists (
          select 1
          from public.shipping_addresses as address
          where address.user_id = profile.id and address.is_default
        )
    $migration$;
  end if;
end;
$$;

alter table public.profiles
  drop column if exists contact_email,
  drop column if exists avatar_url,
  drop column if exists phone,
  drop column if exists street,
  drop column if exists city,
  drop column if exists state,
  drop column if exists province;

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
  insert into public.profiles (id, full_name, phone_number)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone)
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
  user_id uuid references auth.users (id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null default '{}'::jsonb,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'Pending'
    check (status in ('Pending', 'Paid', 'Confirmed', 'Shipped', 'Declined', 'Cancellation Pending')),
  eta date,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists shipping_address jsonb not null default '{}'::jsonb,
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

update public.orders as customer_order
set user_id = account.id
from auth.users as account
where customer_order.user_id is null
  and lower(customer_order.customer_email) = lower(account.email);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'Pending', 'Paid', 'Confirmed', 'Processing', 'Shipping', 'Shipped',
    'Failed', 'Declined', 'Cancellation Pending'
  ));

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

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  expires_at timestamptz
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

create or replace function public.mark_notifications_read(p_notification_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in is required to mark notifications as read.' using errcode = '42501';
  end if;

  update public.notifications
  set read_at = now(),
      expires_at = now() + interval '1 hour'
  where user_id = (select auth.uid())
    and read_at is null
    and (p_notification_ids is null or id = any(p_notification_ids));
end;
$$;

revoke all on function public.mark_notifications_read(uuid[]) from public, anon, authenticated;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

create or replace function public.expire_read_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in is required to clean up notifications.' using errcode = '42501';
  end if;

  delete from public.notifications
  where user_id = (select auth.uid())
    and expires_at <= now();
end;
$$;

revoke all on function public.expire_read_notifications() from public, anon, authenticated;
grant execute on function public.expire_read_notifications() to authenticated;

create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_title text;
  notification_message text;
  order_label text := 'ORD-' || repeat('0', greatest(0, 6 - length(new.order_number::text))) || new.order_number::text;
begin
  if new.user_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return new;
    end if;
  end if;

  case new.status
    when 'Pending' then
      notification_title := 'Order pending';
      notification_message := order_label || ' has been received and is pending confirmation.';
    when 'Failed', 'Declined' then
      notification_title := 'Order failed';
      notification_message := order_label || ' could not be completed. Please contact support if you need help.';
    when 'Processing', 'Paid', 'Confirmed' then
      notification_title := 'Order processing';
      notification_message := order_label || ' is being processed.';
    when 'Shipping' then
      notification_title := 'Order shipping';
      notification_message := order_label || ' is being prepared for delivery.';
    when 'Shipped' then
      notification_title := 'Order shipped';
      notification_message := order_label || ' has shipped.';
    when 'Cancellation Pending' then
      notification_title := 'Cancellation requested';
      notification_message := 'A cancellation was requested for ' || order_label || '.';
    else
      notification_title := 'Order update';
      notification_message := order_label || ' status changed to ' || new.status || '.';
  end case;

  insert into public.notifications (user_id, order_id, title, message)
  values (new.user_id, new.id, notification_title, notification_message);

  return new;
end;
$$;

drop trigger if exists orders_notify_status_change on public.orders;
create trigger orders_notify_status_change
  after insert or update on public.orders
  for each row execute function public.notify_order_status_change();

drop function if exists public.place_order(text, text, text, jsonb);

create or replace function public.place_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_items jsonb,
  p_shipping_address jsonb
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
  if (select auth.uid()) is null then
    raise exception 'Sign in is required to place an order.' using errcode = '42501';
  end if;

  if nullif(btrim(p_customer_name), '') is null
    or nullif(btrim(p_customer_email), '') is null
    or nullif(btrim(p_customer_phone), '') is null then
    raise exception 'Customer name, email, and phone are required.' using errcode = '22023';
  end if;

  if lower(btrim(p_customer_email)) <> lower(coalesce((select auth.jwt() ->> 'email'), '')) then
    raise exception 'Order email must match the signed-in account.' using errcode = '42501';
  end if;

  if p_shipping_address is null
    or jsonb_typeof(p_shipping_address) <> 'object'
    or nullif(btrim(p_shipping_address ->> 'recipient_name'), '') is null
    or nullif(btrim(p_shipping_address ->> 'phone_number'), '') is null
    or nullif(btrim(p_shipping_address ->> 'street_address'), '') is null
    or nullif(btrim(p_shipping_address ->> 'city'), '') is null
    or nullif(btrim(p_shipping_address ->> 'postal_code'), '') is null
    or nullif(btrim(p_shipping_address ->> 'country'), '') is null then
    raise exception 'A complete shipping address is required.' using errcode = '22023';
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
  insert into public.orders as created (user_id, customer_name, customer_email, customer_phone, shipping_address, items, amount)
  values (
    (select auth.uid()),
    btrim(p_customer_name),
    btrim(p_customer_email),
    btrim(p_customer_phone),
    jsonb_build_object(
      'recipient_name', btrim(p_shipping_address ->> 'recipient_name'),
      'phone_number', btrim(p_shipping_address ->> 'phone_number'),
      'street_address', btrim(p_shipping_address ->> 'street_address'),
      'city', btrim(p_shipping_address ->> 'city'),
      'postal_code', btrim(p_shipping_address ->> 'postal_code'),
      'country', btrim(p_shipping_address ->> 'country')
    ),
    order_items,
    order_total
  )
  returning created.id, created.order_number;
end;
$$;

revoke all on function public.place_order(text, text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(text, text, text, jsonb, jsonb) to authenticated;

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
