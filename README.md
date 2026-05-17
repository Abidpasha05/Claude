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

## Mobile app

The Expo app at `apps/mobile` mirrors the customer web flow end-to-end:

- Browse restaurants → menu → tap to add items (floating cart badge)
- Cart screen with quantity controls
- Checkout with time-slot picker, contact form, payment method (cash/card/STC Pay)
- Tap-hosted card payments open in the system browser; the webhook updates the
  order and the mobile tracking screen reflects it live via Realtime
- `/order/[id]` shows the same timeline as the web tracking page
- Orders tab lists past orders for the signed-in user

```bash
cd apps/mobile
cp .env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
# Set EXPO_PUBLIC_API_URL to your LAN IP (e.g. http://192.168.1.10:3000)
npx expo start
```

## Push notifications (Expo Push)

Wired end-to-end:

1. **Registration** — `apps/mobile/src/lib/push.ts` requests permission,
   obtains the Expo push token, and upserts into `push_tokens`. The root
   layout calls this whenever a user signs in.
2. **Daily-menu push** — `POST /api/notifications/daily-menu` (protected by
   `CRON_SECRET`) loops over today's published menus, queues in-app
   notifications, and dispatches to every follower's active tokens via
   `https://exp.host/--/api/v2/push/send`. Configured to run every morning
   at 08:00 UTC via `apps/web/vercel.json`.
3. **Order updates** — when the admin advances a status in
   `/admin/orders`, the status-select fires
   `POST /api/notifications/order-update`, which pushes a friendly message
   to the customer ("Your order is out for delivery").
4. **Dead-token cleanup** — `sendExpoPush` deactivates tokens that come
   back `DeviceNotRegistered` so we don't keep paying for non-existent
   devices.
5. **Deep-linking** — tapping a daily-menu push opens the restaurant
   screen; tapping an order-update push opens that order's tracking
   screen.

Optional: set `EXPO_PUSH_ACCESS_TOKEN` (from your Expo dashboard) once you
enable enhanced push security in the Expo project settings.

## ZATCA e-invoicing (Saudi Arabia)

Phase 1 (Generation) is fully implemented. Phase 2 (Integration) has the
XML builder, hash, and submission scaffold; production use requires the
seller to onboard with ZATCA and store CSID credentials.

What happens automatically:
1. When the admin marks an order `completed`, `/api/zatca/generate/[orderId]`
   is called.
2. The endpoint allocates the next per-seller invoice counter (ICV) via the
   `next_zatca_counter` Postgres function (atomic, race-free).
3. It loads the previous invoice's hash (PIH) — first ever invoice uses
   `base64("0")`.
4. Builds the UBL 2.1 simplified invoice XML (`buildInvoiceXML`).
5. Hashes the XML (SHA-256, base64) and stores it on `orders.zatca_invoice_hash`.
6. Encodes the TLV QR (`generateZatcaQR`) with seller, VAT number,
   timestamp, total, and VAT amount.
7. If the restaurant has `zatca_enabled = true`, submits to the Fatoora
   reporting API.

The customer-facing receipt is at `/orders/[id]/receipt` — it renders the
QR with `qrcode` server-side (no JS needed), prints cleanly, and shows the
ZATCA UUID. A "View tax invoice" link surfaces on the tracking page once
the order completes.

To enable real ZATCA reporting:
```
ZATCA_USERNAME=...
ZATCA_SECRET=...
ZATCA_API_BASE=https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal  # sandbox
```
And set the restaurant's `vat_number` and `zatca_enabled = true`.

## Driver flow

Drivers are users with `restaurant_members.role = 'driver'`. They open the
mobile app, sign in, and `/account` shows an "Open driver dashboard"
button.

**Driver mobile (`apps/mobile/app/driver/`):**
- `_layout.tsx` — guards the route group (auth + driver-role check)
- `index.tsx` — go-online toggle, list of available delivery orders, list
  of active deliveries
- `order/[id].tsx` — full delivery detail with address (deep-link to
  Google Maps), customer call/SMS, "Picked up" → "Delivered" actions, and
  **foreground location streaming** every 10s via `expo-location` while
  the status is `out_for_delivery`

**Driver API (`apps/web/src/app/api/driver/`):**
- `available` — lists open delivery orders + the driver's active set
- `accept` — claim an order via a conditional UPDATE on
  `driver_id IS NULL` (race-safe; one driver wins)
- `status` — advance pickup/delivery, pushes order update to the customer
- `location` — append a `driver_locations` row and refresh the live
  snapshot on `driver_profiles`

**Customer-side:** the tracking page subscribes to `driver_locations` via
Realtime; once a location row exists for the order and status is
`out_for_delivery`, a "View on map" panel appears.

**Restaurant admin (`/admin/drivers`):** roster with online dot,
deliveries-completed count, current assignment per driver, an alert panel
for unassigned deliveries, and an "Add driver" form that links any
existing TableBite account by email.

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
