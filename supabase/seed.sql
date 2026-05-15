-- Seed data for local development

insert into saas_plans (code, name, tier, monthly_price, yearly_price, currency, features, max_branches, max_orders_per_month) values
  ('starter', 'Starter', 'starter', 49, 490, 'USD', '{"daily_menu_push": true, "meal_subscriptions": false, "party_orders": false}', 1, 500),
  ('growth', 'Growth', 'growth', 149, 1490, 'USD', '{"daily_menu_push": true, "meal_subscriptions": true, "party_orders": true, "loyalty": true}', 5, 5000),
  ('enterprise', 'Enterprise', 'enterprise', 499, 4990, 'USD', '{"daily_menu_push": true, "meal_subscriptions": true, "party_orders": true, "loyalty": true, "white_label": true, "api_access": true}', null, null)
on conflict (code) do nothing;

-- Sample restaurant (used by dev; replace in production)
insert into restaurants (id, slug, name, name_ar, description, country_code, currency, timezone)
values (
  '00000000-0000-0000-0000-000000000001',
  'al-noor-kitchen',
  'Al Noor Kitchen',
  'مطبخ النور',
  'Authentic Middle Eastern cuisine, family-owned since 1998.',
  'SA', 'SAR', 'Asia/Riyadh'
) on conflict (id) do nothing;

insert into restaurant_branches (id, restaurant_id, name, address, country_code, city, latitude, longitude, phone)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Riyadh - Olaya',
  '7891 Olaya St, Riyadh',
  'SA', 'Riyadh', 24.6929, 46.6857, '+966500000000'
) on conflict (id) do nothing;

insert into menu_categories (id, restaurant_id, name, name_ar, sort_order) values
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Starters', 'المقبلات', 1),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Mains', 'الأطباق الرئيسية', 2),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Desserts', 'الحلويات', 3),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Beverages', 'المشروبات', 4)
on conflict (id) do nothing;

insert into menu_items (restaurant_id, category_id, name, name_ar, description, price, currency, calories, is_vegetarian, prep_time_minutes, images) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 'Hummus', 'حمص', 'Creamy chickpea dip with tahini and olive oil', 18.00, 'SAR', 320, true, 10, array['https://images.unsplash.com/photo-1547928576-b822bc410bdf?w=800']),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 'Tabbouleh', 'تبولة', 'Fresh parsley salad with bulgur, tomatoes, and lemon', 22.00, 'SAR', 180, true, 8, array['https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800']),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Mandi Chicken', 'مندي دجاج', 'Slow-cooked aromatic chicken with basmati rice', 65.00, 'SAR', 720, false, 35, array['https://images.unsplash.com/photo-1604908554049-1fcd99ec4a4f?w=800']),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Lamb Kabsa', 'كبسة لحم', 'Saudi national dish: spiced rice with tender lamb', 85.00, 'SAR', 890, false, 45, array['https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800']),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Mixed Grill', 'مشاوي مشكلة', 'Kebab, kofta, and shish tawook with grilled vegetables', 95.00, 'SAR', 950, false, 25, array['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800']),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Kunafa', 'كنافة', 'Sweet cheese pastry with rose syrup and pistachios', 28.00, 'SAR', 480, true, 12, array['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800']),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'Mint Lemonade', 'ليمون نعناع', 'Fresh lemonade with mint leaves', 15.00, 'SAR', 90, true, 3, array['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800']),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'Saudi Coffee', 'قهوة سعودية', 'Traditional cardamom coffee served with dates', 12.00, 'SAR', 5, true, 5, array['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800'])
on conflict do nothing;

-- Sample meal plans
insert into meal_plans (restaurant_id, name, name_ar, description, period, meals_per_period, price, currency, delivery_included, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'Weekly Lunch Card', 'باقة الغداء الأسبوعية', '5 lunches/week, delivered to your office or home', 'weekly', 5, 299.00, 'SAR', true, true),
  ('00000000-0000-0000-0000-000000000001', 'Monthly Family Plan', 'الباقة الشهرية للعائلة', '30 main meals per month, mix and match', 'monthly', 30, 1499.00, 'SAR', true, true)
on conflict do nothing;

-- Sample closing-hour promo
insert into promotions (restaurant_id, code, title, title_ar, description, promotion_type, discount_value, daily_start_time, daily_end_time, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'CLOSING25', 'Closing Hour - 25% off', 'خصم 25% قبل الإغلاق', 'Get 25% off all orders placed in the last 2 hours before closing', 'closing_hour', 25.00, '22:00', '23:59', true)
on conflict do nothing;
