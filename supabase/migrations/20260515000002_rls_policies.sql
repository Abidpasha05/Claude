-- Row Level Security policies for multi-tenant access

-- Enable RLS on all user-facing tables
alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table restaurant_branches enable row level security;
alter table restaurant_hours enable row level security;
alter table restaurant_members enable row level security;
alter table restaurant_tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table menu_item_modifiers enable row level security;
alter table menu_item_modifier_options enable row level security;
alter table menu_item_to_modifier enable row level security;
alter table daily_menus enable row level security;
alter table daily_menu_items enable row level security;
alter table weekly_specials enable row level security;
alter table weekly_special_items enable row level security;
alter table customer_addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table reservations enable row level security;
alter table party_orders enable row level security;
alter table meal_plans enable row level security;
alter table meal_plan_items enable row level security;
alter table meal_subscriptions enable row level security;
alter table meal_subscription_redemptions enable row level security;
alter table promotions enable row level security;
alter table promotion_redemptions enable row level security;
alter table feedback enable row level security;
alter table feedback_responses enable row level security;
alter table reviews enable row level security;
alter table loyalty_accounts enable row level security;
alter table loyalty_transactions enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table push_tokens enable row level security;
alter table restaurant_followers enable row level security;
alter table saas_subscriptions enable row level security;
alter table saas_plans enable row level security;

-- Helper: is user a member of restaurant
create or replace function is_restaurant_member(rid uuid) returns boolean as $$
  select exists (
    select 1 from restaurant_members
    where restaurant_id = rid and user_id = auth.uid() and is_active = true
  );
$$ language sql stable security definer;

create or replace function is_platform_admin() returns boolean as $$
  select exists (
    select 1 from restaurant_members
    where user_id = auth.uid() and role = 'platform_admin' and is_active = true
  );
$$ language sql stable security definer;

-- Profiles: users can read all, edit their own
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Restaurants: anyone can read active restaurants; members and admins can update
create policy "restaurants_public_read" on restaurants for select using (is_active = true or is_restaurant_member(id));
create policy "restaurants_member_update" on restaurants for update using (is_restaurant_member(id));
create policy "restaurants_admin_insert" on restaurants for insert with check (is_platform_admin() or auth.uid() is not null);

-- Branches & hours: public read for active
create policy "branches_public_read" on restaurant_branches for select using (is_active = true or is_restaurant_member(restaurant_id));
create policy "branches_member_write" on restaurant_branches for all using (is_restaurant_member(restaurant_id));
create policy "hours_public_read" on restaurant_hours for select using (true);
create policy "hours_member_write" on restaurant_hours for all using (
  exists(select 1 from restaurant_branches b where b.id = branch_id and is_restaurant_member(b.restaurant_id))
);

-- Restaurant members: only members can see member list
create policy "members_self_or_member_read" on restaurant_members for select using (
  user_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "members_owner_write" on restaurant_members for all using (
  exists (
    select 1 from restaurant_members rm
    where rm.restaurant_id = restaurant_members.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role in ('restaurant_owner', 'platform_admin')
  )
);

-- Menu: public read for active items in active restaurants
create policy "categories_public_read" on menu_categories for select using (
  is_active or is_restaurant_member(restaurant_id)
);
create policy "categories_member_write" on menu_categories for all using (is_restaurant_member(restaurant_id));

create policy "menu_items_public_read" on menu_items for select using (
  status != 'hidden' or is_restaurant_member(restaurant_id)
);
create policy "menu_items_member_write" on menu_items for all using (is_restaurant_member(restaurant_id));

create policy "modifiers_public_read" on menu_item_modifiers for select using (true);
create policy "modifiers_member_write" on menu_item_modifiers for all using (is_restaurant_member(restaurant_id));
create policy "modifier_options_public_read" on menu_item_modifier_options for select using (true);
create policy "modifier_options_member_write" on menu_item_modifier_options for all using (
  exists (select 1 from menu_item_modifiers m where m.id = modifier_id and is_restaurant_member(m.restaurant_id))
);
create policy "item_modifiers_public_read" on menu_item_to_modifier for select using (true);
create policy "item_modifiers_member_write" on menu_item_to_modifier for all using (
  exists (select 1 from menu_items i where i.id = menu_item_id and is_restaurant_member(i.restaurant_id))
);

create policy "daily_menus_public_read" on daily_menus for select using (
  is_published or is_restaurant_member(restaurant_id)
);
create policy "daily_menus_member_write" on daily_menus for all using (is_restaurant_member(restaurant_id));
create policy "daily_menu_items_read" on daily_menu_items for select using (true);
create policy "daily_menu_items_write" on daily_menu_items for all using (
  exists (select 1 from daily_menus dm where dm.id = daily_menu_id and is_restaurant_member(dm.restaurant_id))
);

create policy "weekly_specials_public_read" on weekly_specials for select using (
  is_published or is_restaurant_member(restaurant_id)
);
create policy "weekly_specials_member_write" on weekly_specials for all using (is_restaurant_member(restaurant_id));
create policy "weekly_special_items_read" on weekly_special_items for select using (true);
create policy "weekly_special_items_write" on weekly_special_items for all using (
  exists (select 1 from weekly_specials w where w.id = weekly_special_id and is_restaurant_member(w.restaurant_id))
);

-- Customer addresses: owner-only
create policy "addresses_owner_all" on customer_addresses for all using (user_id = auth.uid());

-- Orders: customer sees own, restaurant members see their restaurant's
create policy "orders_customer_read" on orders for select using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "orders_customer_insert" on orders for insert with check (
  customer_id = auth.uid() or customer_id is null
);
create policy "orders_member_update" on orders for update using (is_restaurant_member(restaurant_id));

create policy "order_items_read" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id)))
);
create policy "order_items_insert" on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id)))
);

create policy "order_history_read" on order_status_history for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id)))
);
create policy "order_history_insert" on order_status_history for insert with check (
  exists (select 1 from orders o where o.id = order_id and is_restaurant_member(o.restaurant_id))
);

-- Reservations: customer sees own, members see restaurant's
create policy "reservations_read" on reservations for select using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "reservations_customer_insert" on reservations for insert with check (
  customer_id = auth.uid() or customer_id is null
);
create policy "reservations_member_update" on reservations for update using (
  is_restaurant_member(restaurant_id) or customer_id = auth.uid()
);
create policy "tables_public_read" on restaurant_tables for select using (true);
create policy "tables_member_write" on restaurant_tables for all using (
  exists (select 1 from restaurant_branches b where b.id = branch_id and is_restaurant_member(b.restaurant_id))
);

-- Party orders
create policy "party_read" on party_orders for select using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "party_insert" on party_orders for insert with check (true);
create policy "party_member_update" on party_orders for update using (is_restaurant_member(restaurant_id));

-- Meal plans & subscriptions
create policy "meal_plans_public_read" on meal_plans for select using (is_active or is_restaurant_member(restaurant_id));
create policy "meal_plans_member_write" on meal_plans for all using (is_restaurant_member(restaurant_id));
create policy "meal_plan_items_read" on meal_plan_items for select using (true);
create policy "meal_plan_items_write" on meal_plan_items for all using (
  exists (select 1 from meal_plans p where p.id = meal_plan_id and is_restaurant_member(p.restaurant_id))
);
create policy "meal_subs_read" on meal_subscriptions for select using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "meal_subs_insert" on meal_subscriptions for insert with check (customer_id = auth.uid());
create policy "meal_subs_update" on meal_subscriptions for update using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "redemptions_read" on meal_subscription_redemptions for select using (
  exists (select 1 from meal_subscriptions s where s.id = subscription_id and (s.customer_id = auth.uid() or is_restaurant_member(s.restaurant_id)))
);

-- Promotions: public read active
create policy "promos_public_read" on promotions for select using (is_active or is_restaurant_member(restaurant_id));
create policy "promos_member_write" on promotions for all using (is_restaurant_member(restaurant_id));
create policy "promo_redemptions_read" on promotion_redemptions for select using (
  customer_id = auth.uid() or
  exists (select 1 from promotions p where p.id = promotion_id and is_restaurant_member(p.restaurant_id))
);

-- Feedback
create policy "feedback_read" on feedback for select using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "feedback_insert" on feedback for insert with check (true);
create policy "feedback_member_update" on feedback for update using (is_restaurant_member(restaurant_id));
create policy "feedback_resp_read" on feedback_responses for select using (
  exists (select 1 from feedback f where f.id = feedback_id and (f.customer_id = auth.uid() or is_restaurant_member(f.restaurant_id)))
);
create policy "feedback_resp_insert" on feedback_responses for insert with check (
  exists (select 1 from feedback f where f.id = feedback_id and (f.customer_id = auth.uid() or is_restaurant_member(f.restaurant_id)))
);

-- Reviews: public read published; customer can create
create policy "reviews_public_read" on reviews for select using (is_published or customer_id = auth.uid() or is_restaurant_member(restaurant_id));
create policy "reviews_customer_insert" on reviews for insert with check (customer_id = auth.uid());
create policy "reviews_customer_update" on reviews for update using (customer_id = auth.uid() or is_restaurant_member(restaurant_id));

-- Loyalty
create policy "loyalty_read" on loyalty_accounts for select using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);
create policy "loyalty_tx_read" on loyalty_transactions for select using (
  exists (select 1 from loyalty_accounts a where a.id = account_id and (a.customer_id = auth.uid() or is_restaurant_member(a.restaurant_id)))
);

-- Notifications: owner-only
create policy "notifs_owner" on notifications for all using (user_id = auth.uid());
create policy "notif_prefs_owner" on notification_preferences for all using (user_id = auth.uid());
create policy "push_tokens_owner" on push_tokens for all using (user_id = auth.uid());
create policy "followers_owner" on restaurant_followers for all using (customer_id = auth.uid());
create policy "followers_member_read" on restaurant_followers for select using (
  customer_id = auth.uid() or is_restaurant_member(restaurant_id)
);

-- SaaS
create policy "saas_plans_read" on saas_plans for select using (is_active);
create policy "saas_subs_member_read" on saas_subscriptions for select using (is_restaurant_member(restaurant_id));
