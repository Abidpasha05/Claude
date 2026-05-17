# TableBite — Restaurant SaaS Platform

A multi-tenant SaaS + customer app for restaurants. One platform for online ordering,
table reservations, party catering, meal subscriptions, daily-menu notifications,
complaints, and promotions. Built for the GCC market (Arabic + English, STC Pay /
Tap / HyperPay), but works anywhere.

## What's included

| Feature | Customer | Restaurant Admin | Status |
|---|---|---|---|
| 1. Delivery & takeaway with time slots + Cash/Card/STC Pay | `/r/[slug]/checkout` | `/admin/orders` | Working |
| 2. Daily menu + table booking with arrival time | `/r/[slug]/daily`, `/r/[slug]/book` | `/admin/daily-menu`, `/admin/reservations` | Working |
| 3. Party order booking | `/r/[slug]/party` | `/admin/party-orders` | Working |
| 4. Weekly & monthly meal subscriptions | `/r/[slug]/subscriptions` | `/admin/subscriptions` | Working |
| 5. Daily-menu push notifications to followers | (Expo push) | Publishes via cron `/api/notifications/daily-menu` | Working (notification queue ready, push dispatch stubbed) |
| 6. Complaints & suggestions | `/r/[slug]/feedback` | `/admin/feedback` | Working |
| 7. Daily menu with calories, pricing, photos | Yes | Yes | Working |
| 8. Weekly specials with calories, pricing, photos | `/r/[slug]/specials` | `/admin/specials` | Working |
| 9. Closing-hour offers & promotions | `/r/[slug]/promotions` | `/admin/promotions` | Working |

### Suggested additions (your point #10) — included in schema:

- **Multi-tenant** — every restaurant is a tenant with RLS-enforced isolation
- **Loyalty program** — `loyalty_accounts`, `loyalty_transactions`
- **Reviews & ratings** — `reviews` table, per-item and per-restaurant
- **Inventory** — `stock_count` and `out_of_stock` status on menu items
- **Multi-language (en/ar)** + RTL support
- **VAT/ZATCA fields** — `vat_number`, `zatca_invoice_uuid`, `zatca_invoice_hash`
- **Multi-branch** — `restaurant_branches`, `restaurant_tables`, branch-scoped staff
- **Order status history** — full audit trail
- **SaaS billing** — `saas_plans`, `saas_subscriptions`
- **Payment gateway abstraction** — STC Pay, Tap, HyperPay, Stripe (interchangeable)
- **KDS, driver app, live tracking** — schema ready, UI is next iteration

## Architecture

```
restaurant-saas/
├── apps/
│   ├── web/                 # Next.js 15 — customer storefront + restaurant admin + SaaS marketing
│   │   ├── src/app/
│   │   │   ├── page.tsx                       # Marketing home
│   │   │   ├── for-business/                  # SaaS pricing page
│   │   │   ├── restaurants/                   # Browse restaurants
│   │   │   ├── r/[slug]/                      # Per-restaurant storefront
│   │   │   │   ├── page.tsx                   # Full menu
│   │   │   │   ├── daily/                     # Today's menu
│   │   │   │   ├── specials/                  # Weekly specials
│   │   │   │   ├── book/                      # Table reservation
│   │   │   │   ├── party/                     # Party catering inquiry
│   │   │   │   ├── subscriptions/             # Meal plans
│   │   │   │   ├── promotions/                # Active offers
│   │   │   │   ├── feedback/                  # Complaints & suggestions
│   │   │   │   └── checkout/                  # Cart checkout w/ time slots & payment
│   │   │   ├── admin/                         # Restaurant admin dashboard
│   │   │   ├── api/                           # API routes (orders, reservations, party, feedback, ...)
│   │   │   └── auth/                          # Magic-link sign in
│   │   └── src/lib/payments/                  # Gateway abstraction (STC Pay, Tap, HyperPay, Stripe)
│   └── mobile/                                # Expo (React Native) customer app
│       └── app/                               # expo-router screens
├── packages/
│   └── shared/                                # Cross-app types, zod schemas, pricing, slot generation, i18n
└── supabase/
    ├── migrations/                            # Full multi-tenant schema + RLS policies
    └── seed.sql                               # Sample restaurant + menu + plans + promo
```

## Local setup

```bash
# 1. Install deps
npm install

# 2. Start Supabase locally (requires Supabase CLI)
supabase start
supabase db reset    # runs migrations + seed

# 3. Copy env vars
cp .env.example apps/web/.env.local
# Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# from `supabase status`

# 4. Run the web app
npm run dev:web   # http://localhost:3000

# 5. Run the mobile app (separate terminal)
cd apps/mobile
cp ../../.env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start
```

## Linking a restaurant to your account (first admin)

After signing in once (magic link), run in `supabase db`:

```sql
insert into restaurant_members (restaurant_id, user_id, role)
values ('00000000-0000-0000-0000-000000000001', auth.uid(), 'restaurant_owner');
```

Then visit `/admin`.

## Payment gateways

All gateways implement `PaymentGateway` from `apps/web/src/lib/payments`. Currently
included: **STC Pay** (stub), **Tap Payments** (fully wired), **HyperPay** (stub),
**Stripe** (basic). Without API keys, they return mock intents so the flow is
testable end-to-end.

`pickGateway(method, country)` routes by method + country:
- `stc_pay` → STC Pay
- `card` / `mada` in GCC → Tap
- `card` elsewhere → Stripe

### Tap Payments — production setup

1. Sign up at https://tap.company → get your `sk_test_*` / `sk_live_*` secret key.
2. Set in `.env.local`:
   ```
   TAP_SECRET_KEY=sk_test_xxx
   TAP_WEBHOOK_URL=https://your-domain.com/api/payments/tap/webhook
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```
3. In your Tap dashboard, register the webhook URL above. Tap signs each payload
   with HMAC-SHA256 using your secret key; the handler in
   `apps/web/src/app/api/payments/tap/webhook/route.ts` verifies the `hashstring`
   header before trusting the event.
4. Test flow: choose "Card" at checkout → redirected to Tap's hosted page → use
   Tap's test card `5123450000000008` (any future expiry, CVV `100`) → on return
   you'll land on `/orders/[id]/track` and the status updates live as the
   webhook confirms the payment.

Test mode without keys: leave `TAP_SECRET_KEY` unset. The mock gateway issues
a fake intent and redirects straight to `/orders/[id]/return?mock=1`, which
auto-confirms the order — useful for UI iteration.

## Live order tracking

`/orders/[id]/track` shows a real-time timeline (placed → confirmed → preparing
→ ready/out for delivery → completed) using Supabase Realtime channels. The
customer's page updates instantly when the admin advances the status in
`/admin/orders`, and when Tap's webhook confirms payment.

Realtime is enabled on `orders` and `order_status_history` via the migration
`20260517000003_realtime_publication.sql`.

## Daily-menu notifications (cron)

A cron job (Vercel cron / GitHub Actions / Supabase cron) should hit:

```
POST /api/notifications/daily-menu
x-cron-secret: <CRON_SECRET>
```

It enqueues notifications for all followers of restaurants with a published daily
menu for today. The actual push dispatch (Expo Push / FCM) is a TODO in
`apps/web/src/app/api/notifications/daily-menu/route.ts`.

## What's stubbed vs production-ready

| Area | State |
|---|---|
| Database schema + RLS | Production-ready, multi-tenant |
| Customer ordering flow | Production-ready (cash); payments need real gateway keys |
| Admin dashboards | Functional MVP; needs polish + bulk actions |
| Mobile app | Scaffold (browse + sign in). Full ordering, push wiring needed |
| Payment gateways | Interface + mocks. Wire real APIs when keys are issued |
| ZATCA e-invoicing | Fields in schema; integration with ZATCA Fatoora API pending |
| Push notifications | Queue table + cron stub. Wire Expo Push for real delivery |
| Live order tracking | Schema supports it; UI not built |
| Driver app | Schema supports `driver_id`; app not built |
| KDS (kitchen display) | Schema supports it; UI not built |
| Multi-language UI | Helper exists (`@restaurant-saas/shared` `t()`); apply throughout |

See `docs/architecture.md` for deeper notes.
