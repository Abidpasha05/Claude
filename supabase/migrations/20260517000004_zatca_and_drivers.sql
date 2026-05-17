-- ===================================================================
-- ZATCA — counter + extended restaurant address fields
-- ===================================================================

alter table restaurants
  add column if not exists address_street text,
  add column if not exists address_building text,
  add column if not exists address_district text,
  add column if not exists address_city text,
  add column if not exists address_postal_code text;

create table if not exists zatca_counters (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  last_value bigint not null default 0,
  updated_at timestamptz default now()
);

-- Atomically allocate the next invoice counter value (ICV) per seller.
create or replace function next_zatca_counter(p_restaurant_id uuid)
returns bigint
language plpgsql
as $$
declare
  v_next bigint;
begin
  insert into zatca_counters (restaurant_id, last_value)
    values (p_restaurant_id, 1)
  on conflict (restaurant_id) do update
    set last_value = zatca_counters.last_value + 1,
        updated_at = now()
  returning last_value into v_next;
  return v_next;
end $$;

-- ===================================================================
-- Drivers
-- ===================================================================

-- Drivers can be employed by one restaurant (in-house) or float across
-- multiple (platform-wide marketplace). We attach via restaurant_members
-- with role='driver' for in-house, and use driver_profiles for the
-- driver-specific extras (vehicle, license).

create type driver_status as enum ('offline', 'online', 'on_delivery', 'on_break');

create table if not exists driver_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  vehicle_type text,
  license_plate text,
  phone text,
  status driver_status not null default 'offline',
  current_latitude numeric(10,7),
  current_longitude numeric(10,7),
  last_seen_at timestamptz,
  rating_avg numeric(3,2),
  total_deliveries integer default 0,
  created_at timestamptz default now()
);

-- Live location pings. We append; a cron later truncates rows older than
-- 24 hours to keep storage bounded.
create table if not exists driver_locations (
  id bigserial primary key,
  driver_id uuid not null references profiles(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  heading numeric(5,2),
  speed numeric(5,2),
  recorded_at timestamptz not null default now()
);

create index if not exists idx_driver_locations_driver on driver_locations(driver_id, recorded_at desc);
create index if not exists idx_driver_locations_order on driver_locations(order_id, recorded_at desc);

create or replace function increment_driver_deliveries(p_user_id uuid)
returns void language plpgsql as $$
begin
  update driver_profiles set total_deliveries = total_deliveries + 1
    where user_id = p_user_id;
end $$;

-- Track who claimed an order and when.
alter table orders
  add column if not exists driver_assigned_at timestamptz,
  add column if not exists driver_accepted_at timestamptz,
  add column if not exists driver_picked_up_at timestamptz;

-- ===================================================================
-- RLS
-- ===================================================================

alter table driver_profiles enable row level security;
alter table driver_locations enable row level security;
alter table zatca_counters enable row level security;

-- Drivers manage their own profile; restaurant members can see drivers
-- attached to their restaurant.
create policy "driver_profile_self" on driver_profiles
  for all using (user_id = auth.uid());

create policy "driver_profile_member_read" on driver_profiles
  for select using (
    exists (
      select 1 from restaurant_members rm
      where rm.user_id = auth.uid()
        and rm.is_active = true
        and rm.role in ('restaurant_owner', 'restaurant_staff', 'platform_admin')
    )
  );

-- Driver writes their own location; restaurant members and the assigned
-- order's customer can read it.
create policy "driver_location_self_write" on driver_locations
  for insert with check (driver_id = auth.uid());

create policy "driver_location_self_read" on driver_locations
  for select using (driver_id = auth.uid());

create policy "driver_location_order_parties_read" on driver_locations
  for select using (
    order_id is not null and exists (
      select 1 from orders o
      where o.id = driver_locations.order_id
        and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id))
    )
  );

-- Counters managed by the server-side rpc; locked down to nothing client-side.
create policy "zatca_counter_member_read" on zatca_counters
  for select using (is_restaurant_member(restaurant_id));

-- ===================================================================
-- Realtime
-- ===================================================================

do $$
begin
  begin alter publication supabase_realtime add table driver_locations;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table driver_profiles;
  exception when duplicate_object then null; end;
end $$;

alter table driver_locations replica identity full;
alter table driver_profiles replica identity full;
