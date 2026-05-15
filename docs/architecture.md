# Architecture Notes

## Multi-tenancy model

Every business object is scoped by `restaurant_id`. The `restaurants` table is
the tenant row; the `restaurant_members` table assigns users to restaurants
with a role (`restaurant_owner`, `restaurant_staff`, `driver`,
`platform_admin`). RLS uses the helper `is_restaurant_member(rid)` to gate
write access; reads are public for active rows where appropriate (menu,
restaurant profile, published daily menus, etc.).

A single user can be a member of multiple restaurants (useful for franchises
and group operators). The admin dashboard currently picks the user's first
membership — a tenant switcher is the next improvement.

## Orders

`orders.order_type` covers all five flows in one table:

- `delivery` and `takeaway` — pickup/delivery with `slot_start`/`slot_end`
- `dine_in` — pre-orders linked to a `reservations` row
- `party` — bulk catering (see also `party_orders` for the inquiry phase)
- `subscription` — meals consumed against a `meal_subscriptions` row (via
  `meal_subscription_redemptions`)

`order_status_history` records every transition so the customer can see a
timeline ("placed → confirmed → preparing → ready").

## Payments

The `PaymentGateway` interface decouples the rest of the app from any specific
provider. `pickGateway(method, country)` selects the right one. Each gateway
implements:

- `createIntent` — used at checkout to start the payment
- `verifyWebhook` — used at `/api/payments/[gateway]/webhook` to confirm

For Saudi: STC Pay handles wallet payments; Tap handles Mada/Visa/Mastercard.
HyperPay is an alternative card processor. Stripe is the catch-all for
international markets.

## Daily-menu push pipeline

1. Restaurant admin publishes a daily menu (`is_published = true`).
2. Daily cron hits `POST /api/notifications/daily-menu`.
3. Endpoint finds all `restaurant_followers` with
   `daily_menu_notifications = true` and inserts `notifications` rows.
4. A separate worker dispatches to Expo Push / FCM (TODO).

## Pricing

Pure function `computePricing` in `@restaurant-saas/shared/pricing` is used
both client-side (for live cart totals) and server-side (for authoritative
order creation). Tax is currently hard-coded at 15% (KSA VAT); replace with
the restaurant's configured tax rate per country.

## Localization

`@restaurant-saas/shared/i18n` provides a minimal `t(key, locale)` helper. All
domain rows have `name_ar` / `description_ar` columns. Add RTL detection at
the layout level (`<html dir="rtl">` when locale = `ar`).

## Real-time

Use Supabase Realtime channels for live order updates:

```ts
supabase
  .channel(`orders:${orderId}`)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      payload => setOrder(payload.new))
  .subscribe();
```

For the kitchen display, subscribe to all `orders` for a `restaurant_id`.

## Next steps (in priority order)

1. **Pre-checkout coupon validation** — apply `promotions` before creating order
2. **Payment webhook handlers** — `/api/payments/[gateway]/webhook` per provider
3. **Real Expo push dispatch** — read `push_tokens` and call Expo's push service
4. **Mobile app ordering** — bring cart + checkout into Expo
5. **ZATCA invoice generation** — UBL 2.1 XML + QR code per the Fatoora spec
6. **Live order tracking** — customer-facing page subscribing to status changes
7. **Driver dashboard** — assignment, accept/decline, live location
8. **KDS** — orders flow to a tablet view in the kitchen
9. **Analytics page** — best sellers, peak hours, repeat rate
10. **i18n rollout** — wire `t()` and locale switcher into every page
