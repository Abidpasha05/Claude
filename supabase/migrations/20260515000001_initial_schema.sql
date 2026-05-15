-- Restaurant SaaS - Initial Schema
-- Multi-tenant: each restaurant is a "tenant". Users can be customers, restaurant staff, or platform admins.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================================
-- TENANCY & USERS
-- =========================================================================

create type user_role as enum ('customer', 'restaurant_owner', 'restaurant_staff', 'driver', 'platform_admin');
create type subscription_tier as enum ('trial', 'starter', 'growth', 'enterprise');
create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text,
  full_name text,
  avatar_url text,
  preferred_locale text default 'en',
  preferred_currency text default 'SAR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  logo_url text,
  cover_image_url text,
  cuisine_types text[] default '{}',
  country_code text not null default 'SA',
  currency text not null default 'SAR',
  default_locale text not null default 'en',
  supports_locales text[] not null default '{en,ar}',
  timezone text not null default 'Asia/Riyadh',
  vat_number text,
  zatca_enabled boolean default false,
  delivery_enabled boolean default true,
  takeaway_enabled boolean default true,
  dine_in_enabled boolean default true,
  party_orders_enabled boolean default true,
  subscriptions_enabled boolean default true,
  delivery_radius_km numeric(6,2),
  min_order_amount numeric(10,2) default 0,
  base_delivery_fee numeric(10,2) default 0,
  preparation_time_minutes integer default 30,
  is_active boolean default true,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_restaurants_slug on restaurants(slug);
create index idx_restaurants_active on restaurants(is_active) where is_active = true;

create table restaurant_branches (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  name_ar text,
  address text not null,
  address_ar text,
  city text,
  country_code text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_branches_restaurant on restaurant_branches(restaurant_id);

create table restaurant_hours (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references restaurant_branches(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time time not null,
  close_time time not null,
  is_closed boolean default false
);

create table restaurant_members (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  branch_id uuid references restaurant_branches(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(restaurant_id, user_id)
);

create index idx_members_user on restaurant_members(user_id);
create index idx_members_restaurant on restaurant_members(restaurant_id);

-- =========================================================================
-- SAAS SUBSCRIPTIONS (the platform billing restaurants)
-- =========================================================================

create table saas_plans (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  tier subscription_tier not null,
  monthly_price numeric(10,2) not null,
  yearly_price numeric(10,2) not null,
  currency text not null default 'USD',
  features jsonb not null default '{}',
  max_branches integer,
  max_orders_per_month integer,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table saas_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  plan_id uuid not null references saas_plans(id),
  status subscription_status not null default 'trialing',
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  external_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_saas_subs_restaurant on saas_subscriptions(restaurant_id);

-- =========================================================================
-- MENU
-- =========================================================================

create type menu_item_status as enum ('available', 'out_of_stock', 'hidden', 'scheduled');

create table menu_categories (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  name_ar text,
  description text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_categories_restaurant on menu_categories(restaurant_id);

create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  currency text not null default 'SAR',
  calories integer,
  prep_time_minutes integer,
  status menu_item_status not null default 'available',
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  is_gluten_free boolean default false,
  is_halal boolean default true,
  is_spicy boolean default false,
  spice_level smallint check (spice_level between 0 and 5),
  allergens text[] default '{}',
  tags text[] default '{}',
  images text[] default '{}',
  available_for_delivery boolean default true,
  available_for_takeaway boolean default true,
  available_for_dine_in boolean default true,
  is_party_eligible boolean default false,
  is_subscription_eligible boolean default false,
  stock_count integer,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_menu_items_restaurant on menu_items(restaurant_id);
create index idx_menu_items_category on menu_items(category_id);
create index idx_menu_items_status on menu_items(restaurant_id, status);

create table menu_item_modifiers (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  name_ar text,
  is_required boolean default false,
  min_select smallint default 0,
  max_select smallint default 1
);

create table menu_item_modifier_options (
  id uuid primary key default uuid_generate_v4(),
  modifier_id uuid not null references menu_item_modifiers(id) on delete cascade,
  name text not null,
  name_ar text,
  price_delta numeric(10,2) default 0,
  sort_order integer default 0
);

create table menu_item_to_modifier (
  menu_item_id uuid references menu_items(id) on delete cascade,
  modifier_id uuid references menu_item_modifiers(id) on delete cascade,
  primary key (menu_item_id, modifier_id)
);

-- Daily menu: items can be scheduled for specific dates / day-of-week
create table daily_menus (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  menu_date date not null,
  title text,
  title_ar text,
  notes text,
  is_published boolean default false,
  created_at timestamptz default now(),
  unique(restaurant_id, menu_date)
);

create table daily_menu_items (
  daily_menu_id uuid references daily_menus(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete cascade,
  sort_order integer default 0,
  override_price numeric(10,2),
  primary key (daily_menu_id, menu_item_id)
);

-- Weekly special menu
create table weekly_specials (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  week_start date not null,
  title text,
  title_ar text,
  banner_image_url text,
  is_published boolean default false,
  unique(restaurant_id, week_start)
);

create table weekly_special_items (
  weekly_special_id uuid references weekly_specials(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete cascade,
  override_price numeric(10,2),
  sort_order integer default 0,
  primary key (weekly_special_id, menu_item_id)
);

-- =========================================================================
-- ORDERS (takeaway + delivery + dine-in)
-- =========================================================================

create type order_type as enum ('delivery', 'takeaway', 'dine_in', 'party', 'subscription');
create type order_status as enum (
  'pending_payment', 'placed', 'confirmed', 'preparing',
  'ready_for_pickup', 'out_for_delivery', 'completed',
  'canceled', 'refunded', 'failed'
);
create type payment_method as enum ('cash', 'card', 'stc_pay', 'apple_pay', 'mada', 'tap', 'hyperpay', 'stripe', 'wallet');
create type payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');

create table customer_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,
  address_line1 text not null,
  address_line2 text,
  city text,
  country_code text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_default boolean default false,
  created_at timestamptz default now()
);

create index idx_addresses_user on customer_addresses(user_id);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  restaurant_id uuid not null references restaurants(id),
  branch_id uuid references restaurant_branches(id),
  customer_id uuid references profiles(id),
  guest_phone text,
  guest_name text,
  order_type order_type not null,
  status order_status not null default 'pending_payment',
  -- Time slot
  requested_for timestamptz,
  slot_start timestamptz,
  slot_end timestamptz,
  -- Addressing / dine-in
  delivery_address_id uuid references customer_addresses(id),
  delivery_address_snapshot jsonb,
  table_number text,
  party_size smallint,
  -- Money
  currency text not null default 'SAR',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) default 0,
  delivery_fee numeric(10,2) default 0,
  tax_total numeric(10,2) default 0,
  tip_total numeric(10,2) default 0,
  grand_total numeric(10,2) not null default 0,
  -- Payment
  payment_method payment_method,
  payment_status payment_status not null default 'pending',
  payment_reference text,
  -- Misc
  notes text,
  coupon_code text,
  loyalty_points_earned integer default 0,
  loyalty_points_redeemed integer default 0,
  driver_id uuid references profiles(id),
  zatca_invoice_uuid text,
  zatca_invoice_hash text,
  cancellation_reason text,
  metadata jsonb default '{}',
  placed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_restaurant on orders(restaurant_id, status);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_created on orders(created_at desc);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name_snapshot text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  modifiers jsonb default '[]',
  notes text,
  line_total numeric(10,2) not null
);

create index idx_order_items_order on order_items(order_id);

create table order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  notes text,
  changed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- =========================================================================
-- TABLE RESERVATIONS (book table with arrival time)
-- =========================================================================

create type reservation_status as enum ('pending', 'confirmed', 'seated', 'completed', 'no_show', 'canceled');

create table restaurant_tables (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references restaurant_branches(id) on delete cascade,
  table_number text not null,
  capacity smallint not null,
  is_active boolean default true,
  unique(branch_id, table_number)
);

create table reservations (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  branch_id uuid not null references restaurant_branches(id),
  table_id uuid references restaurant_tables(id),
  customer_id uuid references profiles(id),
  guest_name text,
  guest_phone text,
  party_size smallint not null,
  arrival_time timestamptz not null,
  duration_minutes integer default 90,
  status reservation_status not null default 'pending',
  notes text,
  linked_order_id uuid references orders(id),
  deposit_amount numeric(10,2) default 0,
  deposit_paid boolean default false,
  created_at timestamptz default now()
);

create index idx_reservations_restaurant on reservations(restaurant_id, arrival_time);

-- =========================================================================
-- PARTY ORDERS (large group catering)
-- =========================================================================

create type party_order_status as enum ('inquiry', 'quoted', 'confirmed', 'preparing', 'delivered', 'completed', 'canceled');

create table party_orders (
  id uuid primary key default uuid_generate_v4(),
  party_number text unique not null,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid references profiles(id),
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  event_name text,
  event_date timestamptz not null,
  guest_count integer not null,
  service_type text, -- 'drop-off', 'buffet', 'plated', 'staff-included'
  venue_address text,
  status party_order_status not null default 'inquiry',
  selected_items jsonb default '[]',
  special_requests text,
  quote_amount numeric(10,2),
  deposit_amount numeric(10,2),
  deposit_paid boolean default false,
  final_amount numeric(10,2),
  payment_status payment_status default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_party_restaurant on party_orders(restaurant_id, event_date);

-- =========================================================================
-- MEAL SUBSCRIPTIONS (weekly/monthly meals card)
-- =========================================================================

create type meal_plan_period as enum ('weekly', 'monthly');
create type meal_subscription_status as enum ('active', 'paused', 'canceled', 'expired');

create table meal_plans (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  name_ar text,
  description text,
  period meal_plan_period not null,
  meals_per_period integer not null,
  price numeric(10,2) not null,
  currency text not null default 'SAR',
  delivery_included boolean default false,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table meal_plan_items (
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete cascade,
  is_swappable boolean default true,
  primary key (meal_plan_id, menu_item_id)
);

create table meal_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id),
  customer_id uuid not null references profiles(id),
  meal_plan_id uuid not null references meal_plans(id),
  status meal_subscription_status not null default 'active',
  start_date date not null,
  end_date date,
  meals_remaining integer not null,
  delivery_address_id uuid references customer_addresses(id),
  delivery_time_slot text,
  payment_status payment_status not null default 'pending',
  created_at timestamptz default now()
);

create index idx_meal_subs_customer on meal_subscriptions(customer_id);

create table meal_subscription_redemptions (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid not null references meal_subscriptions(id) on delete cascade,
  order_id uuid references orders(id),
  redeemed_at timestamptz default now(),
  meals_used integer not null default 1
);

-- =========================================================================
-- PROMOTIONS, COUPONS, CLOSING-HOUR OFFERS
-- =========================================================================

create type promotion_type as enum ('percentage', 'fixed_amount', 'bogo', 'free_delivery', 'happy_hour', 'closing_hour');

create table promotions (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  code text,
  title text not null,
  title_ar text,
  description text,
  description_ar text,
  banner_image_url text,
  promotion_type promotion_type not null,
  discount_value numeric(10,2),
  min_order_amount numeric(10,2),
  max_discount_amount numeric(10,2),
  starts_at timestamptz,
  ends_at timestamptz,
  -- For happy/closing-hour offers:
  daily_start_time time,
  daily_end_time time,
  days_of_week smallint[] default '{0,1,2,3,4,5,6}',
  applies_to_categories uuid[] default '{}',
  applies_to_items uuid[] default '{}',
  usage_limit integer,
  usage_limit_per_customer integer default 1,
  times_used integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_promotions_restaurant on promotions(restaurant_id, is_active);

create table promotion_redemptions (
  id uuid primary key default uuid_generate_v4(),
  promotion_id uuid not null references promotions(id) on delete cascade,
  order_id uuid references orders(id),
  customer_id uuid references profiles(id),
  discount_applied numeric(10,2) not null,
  created_at timestamptz default now()
);

-- =========================================================================
-- COMPLAINTS & SUGGESTIONS
-- =========================================================================

create type feedback_type as enum ('complaint', 'suggestion', 'compliment', 'bug');
create type feedback_status as enum ('open', 'in_review', 'responded', 'resolved', 'closed');

create table feedback (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid references profiles(id),
  order_id uuid references orders(id),
  feedback_type feedback_type not null,
  subject text,
  body text not null,
  rating smallint check (rating between 1 and 5),
  status feedback_status not null default 'open',
  contact_name text,
  contact_email text,
  contact_phone text,
  attachments text[] default '{}',
  assigned_to uuid references profiles(id),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index idx_feedback_restaurant on feedback(restaurant_id, status);

create table feedback_responses (
  id uuid primary key default uuid_generate_v4(),
  feedback_id uuid not null references feedback(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  is_internal boolean default false,
  created_at timestamptz default now()
);

-- =========================================================================
-- REVIEWS (per-item and per-restaurant)
-- =========================================================================

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid not null references profiles(id),
  order_id uuid references orders(id),
  menu_item_id uuid references menu_items(id),
  rating smallint not null check (rating between 1 and 5),
  body text,
  images text[] default '{}',
  is_published boolean default true,
  reply text,
  replied_at timestamptz,
  created_at timestamptz default now()
);

create index idx_reviews_restaurant on reviews(restaurant_id);
create index idx_reviews_item on reviews(menu_item_id);

-- =========================================================================
-- LOYALTY
-- =========================================================================

create table loyalty_accounts (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  points_balance integer not null default 0,
  lifetime_points integer not null default 0,
  tier text default 'bronze',
  unique(restaurant_id, customer_id)
);

create table loyalty_transactions (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references loyalty_accounts(id) on delete cascade,
  order_id uuid references orders(id),
  delta integer not null,
  reason text,
  created_at timestamptz default now()
);

-- =========================================================================
-- NOTIFICATIONS (daily menu push, order updates, promos)
-- =========================================================================

create type notification_channel as enum ('push', 'email', 'sms', 'whatsapp', 'in_app');
create type notification_kind as enum (
  'daily_menu', 'order_update', 'reservation_reminder',
  'promotion', 'subscription_reminder', 'party_update', 'feedback_reply'
);

create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  push_enabled boolean default true,
  email_enabled boolean default true,
  sms_enabled boolean default false,
  whatsapp_enabled boolean default false,
  daily_menu_enabled boolean default true,
  promotions_enabled boolean default true
);

create table push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  token text not null,
  platform text,
  device_id text,
  is_active boolean default true,
  last_used_at timestamptz default now(),
  unique(user_id, token)
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  kind notification_kind not null,
  channel notification_channel not null,
  title text not null,
  body text not null,
  data jsonb default '{}',
  is_read boolean default false,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_notifications_user on notifications(user_id, is_read);

-- Customers can follow restaurants to get daily-menu notifications
create table restaurant_followers (
  restaurant_id uuid references restaurants(id) on delete cascade,
  customer_id uuid references profiles(id) on delete cascade,
  daily_menu_notifications boolean default true,
  promotion_notifications boolean default true,
  created_at timestamptz default now(),
  primary key (restaurant_id, customer_id)
);

-- =========================================================================
-- TRIGGERS
-- =========================================================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_restaurants_updated before update on restaurants for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders for each row execute function set_updated_at();
create trigger trg_party_orders_updated before update on party_orders for each row execute function set_updated_at();
create trigger trg_menu_items_updated before update on menu_items for each row execute function set_updated_at();
create trigger trg_saas_subs_updated before update on saas_subscriptions for each row execute function set_updated_at();

-- Auto-create profile on auth.users insert
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  insert into public.notification_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end $$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Order number generator
create sequence if not exists order_number_seq start 100000;

create or replace function generate_order_number() returns trigger as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || nextval('order_number_seq');
  end if;
  return new;
end $$ language plpgsql;

create trigger trg_orders_number before insert on orders
  for each row execute function generate_order_number();

create sequence if not exists party_number_seq start 1000;

create or replace function generate_party_number() returns trigger as $$
begin
  if new.party_number is null or new.party_number = '' then
    new.party_number := 'PTY-' || to_char(now(), 'YYMM') || '-' || nextval('party_number_seq');
  end if;
  return new;
end $$ language plpgsql;

create trigger trg_party_number before insert on party_orders
  for each row execute function generate_party_number();
