import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PartyOrderForm } from './party-form';

export default async function PartyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, party_orders_enabled')
    .eq('slug', slug)
    .single();
  if (!restaurant) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Party Orders</h1>
      <p className="text-neutral-600 mb-6">
        Catering for events, gatherings, and corporate functions. We'll send you a quote within 24 hours.
      </p>
      {restaurant.party_orders_enabled ? (
        <PartyOrderForm restaurantId={restaurant.id} />
      ) : (
        <div className="card p-6 text-neutral-600">Party orders are not enabled for this restaurant.</div>
      )}
    </div>
  );
}
