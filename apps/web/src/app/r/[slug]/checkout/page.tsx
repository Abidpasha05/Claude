import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from './checkout-form';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, currency, delivery_enabled, takeaway_enabled, base_delivery_fee, preparation_time_minutes')
    .eq('slug', slug)
    .single();

  if (!restaurant) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <CheckoutForm restaurant={restaurant} slug={slug} />
    </div>
  );
}
