import Link from 'next/link';
import { ArrowRight, Utensils, Clock, Truck, Users, CalendarDays, Bell, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Arkan home">
            <img src="/brand/logo-mark.svg" alt="" width={28} height={28} />
            <span className="font-bold text-xl text-brand-700">Arkan</span>
            <span className="hidden sm:inline text-xs text-neutral-500" dir="rtl">أركان</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/restaurants" className="hover:text-brand-700">Restaurants</Link>
            <Link href="/for-business" className="hover:text-brand-700">For Restaurants</Link>
            <Link href="/admin" className="hover:text-brand-700">Restaurant Admin</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/sign-in" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/restaurants" className="btn-primary text-sm">Order Now</Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="badge bg-brand-100 text-brand-700 mb-4">Arkan · أركان</span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              From kitchen to&nbsp;customer,<br />
              <span className="text-brand-700">all in one.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-600">
              Orders, bookings, party catering, meal subscriptions, kitchen display,
              driver dispatch, and ZATCA invoicing &mdash; one platform built for the GCC.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/restaurants" className="btn-primary">
                Order from a restaurant <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/for-business" className="btn-secondary">
                Get Arkan for your restaurant
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200"
              alt="Restaurant"
              className="rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything diners and restaurants need</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Feature icon={<Truck />} title="Delivery & Takeaway" desc="Book a pickup or delivery slot. Pay with cash, card, or STC Pay." />
          <Feature icon={<CalendarDays />} title="Table Booking" desc="Reserve a table with arrival time and pre-order from the daily menu." />
          <Feature icon={<Users />} title="Party Orders" desc="Plan large events with custom menus, quotes, and deposits." />
          <Feature icon={<Utensils />} title="Meal Subscriptions" desc="Weekly and monthly meal cards delivered on a schedule." />
          <Feature icon={<Bell />} title="Daily Menu Push" desc="Subscribers get the day's menu, specials, and closing-hour deals." />
          <Feature icon={<Star />} title="Reviews & Feedback" desc="Complaints, suggestions, ratings — closed-loop with the restaurant." />
        </div>
      </section>

      <section className="bg-neutral-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Built for the GCC market</h2>
          <p className="text-neutral-300 mb-8">
            Arabic + English with RTL. Multi-currency. ZATCA e-invoicing for Saudi.
            Local payment rails: STC Pay, Mada, Tap, HyperPay.
          </p>
          <Link href="/for-business" className="btn-primary">Start free trial</Link>
        </div>
      </section>

      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-sm text-neutral-500 flex flex-wrap justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Arkan</p>
          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card p-6">
      <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-neutral-600">{desc}</p>
    </div>
  );
}
