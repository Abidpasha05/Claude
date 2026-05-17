import Link from 'next/link';
import { Check } from 'lucide-react';

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Arkan home">
            <img src="/brand/logo-mark.svg" alt="" width={28} height={28} />
            <span className="font-bold text-xl text-brand-700">Arkan</span>
            <span className="hidden sm:inline text-xs text-neutral-500" dir="rtl">أركان</span>
          </Link>
          <Link href="/auth/sign-in" className="btn-primary text-sm">Sign in to your dashboard</Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-brand-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <span className="badge bg-brand-100 text-brand-700 mb-4">Arkan for restaurants</span>
          <h1 className="text-4xl md:text-5xl font-bold">From kitchen to customer, all in one.</h1>
          <p className="mt-4 text-lg text-neutral-600">
            Take orders, manage bookings, run promotions, dispatch drivers, and send the daily menu &mdash;
            from a single dashboard, with ZATCA invoicing built in.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Plan name="Starter" price="$49" features={['1 branch', '500 orders/month', 'Daily menu push', 'Online ordering']} />
          <Plan name="Growth" price="$149" features={['5 branches', '5,000 orders/month', 'Meal subscriptions', 'Party orders', 'Loyalty program']} highlighted />
          <Plan name="Enterprise" price="$499" features={['Unlimited branches', 'Unlimited orders', 'White-label app', 'API access', 'Priority support']} />
        </div>
      </section>

      <section className="bg-neutral-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-neutral-300 mb-6">14-day free trial. No credit card required.</p>
          <Link href="/auth/sign-in" className="btn-primary">Start free trial</Link>
        </div>
      </section>
    </div>
  );
}

function Plan({ name, price, features, highlighted = false }: { name: string; price: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`card p-6 ${highlighted ? 'border-brand-500 border-2' : ''}`}>
      {highlighted && <span className="badge bg-brand-100 text-brand-700 mb-2">Most popular</span>}
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="mt-2"><span className="text-3xl font-bold">{price}</span><span className="text-neutral-500">/mo</span></p>
      <ul className="mt-4 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/auth/sign-in" className={`btn-primary w-full mt-6 ${highlighted ? '' : 'btn-secondary'}`}>Start trial</Link>
    </div>
  );
}
