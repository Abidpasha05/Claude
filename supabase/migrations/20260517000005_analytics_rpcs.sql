-- Analytics RPCs. Pre-aggregated server-side so the admin dashboard can pull
-- everything in one round trip without N+1 queries.
--
-- All functions take (p_restaurant_id, p_days) and respect RLS by being
-- SECURITY INVOKER — callers must be members of the restaurant.

-- Daily revenue + order count for the last p_days days.
create or replace function restaurant_revenue_by_day(p_restaurant_id uuid, p_days int default 30)
returns table (
  day date,
  orders bigint,
  revenue numeric,
  avg_order numeric
)
language sql
stable
security invoker
as $$
  with series as (
    select generate_series(
      (current_date - (p_days - 1))::date,
      current_date,
      interval '1 day'
    )::date as day
  )
  select
    s.day,
    coalesce(count(o.id), 0)::bigint as orders,
    coalesce(sum(o.grand_total), 0)::numeric as revenue,
    coalesce(avg(o.grand_total), 0)::numeric as avg_order
  from series s
  left join orders o
    on date_trunc('day', o.placed_at at time zone 'UTC')::date = s.day
    and o.restaurant_id = p_restaurant_id
    and o.status in ('completed', 'out_for_delivery', 'ready_for_pickup', 'preparing', 'confirmed', 'placed')
  group by s.day
  order by s.day;
$$;

-- Best-selling items in the period.
create or replace function restaurant_best_sellers(
  p_restaurant_id uuid,
  p_days int default 30,
  p_limit int default 10
)
returns table (
  menu_item_id uuid,
  name text,
  units_sold bigint,
  revenue numeric
)
language sql
stable
security invoker
as $$
  select
    oi.menu_item_id,
    oi.name_snapshot as name,
    sum(oi.quantity)::bigint as units_sold,
    sum(oi.line_total)::numeric as revenue
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.restaurant_id = p_restaurant_id
    and o.placed_at >= now() - (p_days || ' days')::interval
    and o.status not in ('canceled', 'failed', 'refunded')
  group by oi.menu_item_id, oi.name_snapshot
  order by units_sold desc
  limit p_limit;
$$;

-- Order count by hour-of-day, across the period — for peak-hour heatmap.
create or replace function restaurant_peak_hours(p_restaurant_id uuid, p_days int default 30)
returns table (
  hour_of_day int,
  orders bigint,
  revenue numeric
)
language sql
stable
security invoker
as $$
  with hours as (
    select generate_series(0, 23) as hour_of_day
  )
  select
    h.hour_of_day,
    coalesce(count(o.id), 0)::bigint as orders,
    coalesce(sum(o.grand_total), 0)::numeric as revenue
  from hours h
  left join orders o
    on extract(hour from o.placed_at at time zone 'UTC')::int = h.hour_of_day
    and o.restaurant_id = p_restaurant_id
    and o.placed_at >= now() - (p_days || ' days')::interval
    and o.status not in ('canceled', 'failed', 'refunded')
  group by h.hour_of_day
  order by h.hour_of_day;
$$;

-- Order-type and payment-method breakdowns.
create or replace function restaurant_breakdowns(p_restaurant_id uuid, p_days int default 30)
returns table (
  dimension text,
  bucket text,
  orders bigint,
  revenue numeric
)
language sql
stable
security invoker
as $$
  select 'order_type'::text as dimension, o.order_type::text as bucket,
    count(*)::bigint, sum(o.grand_total)::numeric
  from orders o
  where o.restaurant_id = p_restaurant_id
    and o.placed_at >= now() - (p_days || ' days')::interval
    and o.status not in ('canceled', 'failed', 'refunded')
  group by o.order_type
  union all
  select 'payment_method'::text, o.payment_method::text,
    count(*)::bigint, sum(o.grand_total)::numeric
  from orders o
  where o.restaurant_id = p_restaurant_id
    and o.placed_at >= now() - (p_days || ' days')::interval
    and o.payment_method is not null
    and o.status not in ('canceled', 'failed', 'refunded')
  group by o.payment_method;
$$;

-- Headline summary: totals + comparison vs the prior period of equal length.
create or replace function restaurant_summary(p_restaurant_id uuid, p_days int default 30)
returns table (
  total_orders bigint,
  total_revenue numeric,
  avg_order numeric,
  unique_customers bigint,
  prior_orders bigint,
  prior_revenue numeric,
  prior_avg_order numeric,
  prior_unique_customers bigint
)
language sql
stable
security invoker
as $$
  with current_p as (
    select id, customer_id, grand_total
    from orders
    where restaurant_id = p_restaurant_id
      and placed_at >= now() - (p_days || ' days')::interval
      and status not in ('canceled', 'failed', 'refunded')
  ), prior_p as (
    select id, customer_id, grand_total
    from orders
    where restaurant_id = p_restaurant_id
      and placed_at >= now() - ((p_days * 2) || ' days')::interval
      and placed_at <  now() - (p_days || ' days')::interval
      and status not in ('canceled', 'failed', 'refunded')
  )
  select
    (select count(*) from current_p)::bigint,
    (select coalesce(sum(grand_total), 0) from current_p)::numeric,
    (select coalesce(avg(grand_total), 0) from current_p)::numeric,
    (select count(distinct customer_id) from current_p where customer_id is not null)::bigint,
    (select count(*) from prior_p)::bigint,
    (select coalesce(sum(grand_total), 0) from prior_p)::numeric,
    (select coalesce(avg(grand_total), 0) from prior_p)::numeric,
    (select count(distinct customer_id) from prior_p where customer_id is not null)::bigint;
$$;
