alter table public.products
  add column if not exists size_system text;

alter table public.products
  drop constraint if exists products_required_details_check;

alter table public.products
  add constraint products_required_details_check
  check (
    nullif(btrim(title), '') is not null
    and nullif(btrim(description), '') is not null
    and price > 0
    and nullif(btrim(image_url), '') is not null
    and category in ('men', 'women', 'children', 'bags', 'footwear-men', 'footwear-women')
    and (
      (category = 'bags' and size_system is null and cardinality(available_sizes) = 0)
      or (
        category in ('footwear-men', 'footwear-women')
        and size_system in ('US', 'UK')
        and cardinality(available_sizes) > 0
        and array_to_string(available_sizes, ',') ~ '^[1-9][0-9]*([.]5)?(,[1-9][0-9]*([.]5)?)*$'
      )
      or (
        category in ('men', 'women', 'children')
        and size_system is null
        and cardinality(available_sizes) > 0
      )
    )
    and cardinality(tags) > 0
    and array_to_string(tags, '') ~ '[^[:space:]]'
  ) not valid;

create or replace function public.place_order(
  p_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_items jsonb,
  p_shipping_address jsonb,
  p_payment_amount_cents bigint,
  p_payment_reference text
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
  product_sizes text[];
  product_category text;
  product_size_system text;
  product_image text;
  product_is_archived boolean;
  order_items jsonb := '[]'::jsonb;
  order_total numeric(12, 2) := 0;
  shipping_fee numeric(12, 2) := 0;
begin
  if p_user_id is null then
    raise exception 'A signed-in customer is required to place an order.' using errcode = '42501';
  end if;

  if nullif(btrim(p_customer_name), '') is null
    or nullif(btrim(p_customer_email), '') is null
    or nullif(btrim(p_customer_phone), '') is null then
    raise exception 'Customer name, email, and phone are required.' using errcode = '22023';
  end if;

  if lower(btrim(p_customer_email)) <> lower(coalesce((select email from auth.users where id = p_user_id), '')) then
    raise exception 'Order email must match the signed-in account.' using errcode = '42501';
  end if;

  if nullif(btrim(p_payment_reference), '') is null then
    raise exception 'A completed payment confirmation is required before placing an order.' using errcode = '22023';
  end if;

  if btrim(p_customer_phone) !~ '^\+947[0-9]{8}$'
    or btrim(p_shipping_address ->> 'phone_number') !~ '^\+947[0-9]{8}$' then
    raise exception 'A valid Sri Lankan mobile number in E.164 format is required.' using errcode = '22023';
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
    select product_id, quantity, size, size_system
    from jsonb_to_recordset(p_items) as requested(product_id uuid, quantity integer, size text, size_system text)
  loop
    if order_line.product_id is null or order_line.quantity is null
      or order_line.quantity < 1 or order_line.quantity > 20 then
      raise exception 'Order item quantity is invalid.' using errcode = '22023';
    end if;

    select product.title, product.price, product.stock, product.available_sizes, product.category, product.size_system, product.image_url, product.is_archived
    into product_title, product_price, product_stock, product_sizes, product_category, product_size_system, product_image, product_is_archived
    from public.products as product
    where product.id = order_line.product_id
    for update;

    if not found then
      raise exception 'An item in this order is no longer available.' using errcode = '22023';
    end if;
    if product_is_archived then
      raise exception 'An item in this order is no longer available.' using errcode = '22023';
    end if;
    if product_stock < order_line.quantity then
      raise exception 'There is not enough stock for %.', product_title using errcode = '22023';
    end if;
    if product_category = 'bags' then
      if nullif(btrim(order_line.size), '') is not null or order_line.size_system is not null then
        raise exception 'Bags do not use sizes.' using errcode = '22023';
      end if;
    else
      if nullif(btrim(order_line.size), '') is null then
        raise exception 'A size must be selected for every product except bags.' using errcode = '22023';
      end if;
      if product_category in ('footwear-men', 'footwear-women') then
        if order_line.size_system is distinct from product_size_system then
          raise exception 'Choose a footwear size in the product sizing system.' using errcode = '22023';
        end if;
      elsif order_line.size_system is not null then
        raise exception 'A footwear sizing system cannot be used for this product.' using errcode = '22023';
      end if;
      if not (product_sizes @> array[btrim(order_line.size)]::text[]) then
        raise exception 'The selected size for % is no longer available.', product_title using errcode = '22023';
      end if;
    end if;

    update public.products
    set stock = stock - order_line.quantity
    where public.products.id = order_line.product_id;

    order_total := order_total + product_price * order_line.quantity;
    order_items := order_items || jsonb_build_array(jsonb_build_object(
      'productId', order_line.product_id,
      'title', product_title,
      'size', case
        when product_category = 'bags' then null
        when product_size_system is not null then product_size_system || ' ' || btrim(order_line.size)
        else btrim(order_line.size)
      end,
      'quantity', order_line.quantity,
      'unitPrice', product_price,
      'imageUrl', product_image
    ));
  end loop;

  if order_total < 10000 then
    shipping_fee := 500;
  end if;

  if p_payment_amount_cents is null
    or round((order_total + shipping_fee) * 100)::bigint <> p_payment_amount_cents then
    raise exception 'The confirmed payment amount does not match the order total.' using errcode = '22023';
  end if;

  return query
  insert into public.orders as created (
    user_id, customer_name, customer_email, customer_phone, shipping_address, items, amount, status, payment_reference
  )
  values (
    p_user_id,
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
    order_total + shipping_fee,
    'Paid',
    btrim(p_payment_reference)
  )
  returning created.id, created.order_number;
end;
$$;

revoke all on function public.place_order(uuid, text, text, text, jsonb, jsonb, bigint, text) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, text, text, jsonb, jsonb, bigint, text) to service_role;
