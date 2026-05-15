import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@restaurant-saas/shared';

export default async function SubscriptionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, subscriptions_enabled')
    .eq('slug', slug)
    .single();
  if (!restaurant) notFound();

  const { data: plans } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Meal Plans</h1>
      <p className="text-neutral-600 mb-6">
        Pre-pay for a week or month of meals. Lock in the price, skip the daily decision.
      </p>

      {!restaurant.subscriptions_enabled ? (
        <div className="card p-6 text-neutral-600">Meal subscriptions are not available.</div>
      ) : !plans?.length ? (
        <div className="card p-10 text-center text-neutral-500">No plans available yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="card p-6">
              <span className="badge bg-brand-100 text-brand-700 mb-2 capitalize">{p.period}</span>
              <h3 className="text-lg font-semibold">{p.name}</h3>
              {p.description && <p className="text-sm text-neutral-600 mt-1">{p.description}</p>}
              <div className="mt-4 flex items-end gap-1">
                <span className="text-2xl font-bold">{formatMoney(p.price, p.currency)}</span>
                <span className="text-sm text-neutral-500">/ {p.period === 'weekly' ? 'week' : 'month'}</span>
              </div>
              <ul className="text-sm text-neutral-600 mt-3 space-y-1">
                <li>• {p.meals_per_period} meals included</li>
                <li>• {p.delivery_included ? 'Delivery included' : 'Pickup only'}</li>
              </ul>
              <Link href={`/r/${slug}/subscriptions/${p.id}/subscribe`} className="btn-primary mt-5 w-full">
                Subscribe
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
