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
included: **STC Pay**, **Tap Payments**, **HyperPay**, **Stripe**. Without API keys,
they return mock intents so the flow is testable end-to-end.

`pickGateway(method, country)` routes by method + country:
- `stc_pay` → STC Pay
- `card` / `mada` in GCC → Tap
- `card` elsewhere → Stripe

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
