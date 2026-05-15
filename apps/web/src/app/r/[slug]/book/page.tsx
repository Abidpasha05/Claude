import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReservationForm } from './reservation-form';

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, dine_in_enabled')
    .eq('slug', slug)
    .single();
  if (!restaurant) notFound();

  const { data: branches } = await supabase
    .from('restaurant_branches')
    .select('id, name, address, city')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true);

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name, price, currency')
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'available')
    .order('name');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Book a table</h1>
      <p className="text-neutral-600 mb-6">
        Reserve your table at {restaurant.name}. You can pre-order from the menu to skip the wait.
      </p>
      {restaurant.dine_in_enabled ? (
        <ReservationForm
          restaurantId={restaurant.id}
          branches={branches ?? []}
          menuItems={menuItems ?? []}
        />
      ) : (
        <div className="card p-6 text-neutral-600">Dine-in is currently unavailable.</div>
      )}
    </div>
  );
}
