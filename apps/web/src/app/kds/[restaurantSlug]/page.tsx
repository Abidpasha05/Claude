import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { KdsBoard } from './kds-board';

export const dynamic = 'force-dynamic';

// Full-screen kitchen display. Lives outside /admin so it can run in its
// own layout (no sidebar, dark, optimised for landscape on a tablet).
export default async function KDSPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=/kds/${restaurantSlug}`);

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, currency, preparation_time_minutes')
    .eq('slug', restaurantSlug)
    .single();
  if (!restaurant) redirect('/');

  // Verify the user is staff at this restaurant.
  const { data: membership } = await supabase
    .from('restaurant_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .single();
  if (!membership) redirect('/');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, order_type, status, slot_start, placed_at, notes, guest_name, grand_total, currency, order_items(name_snapshot, quantity, notes)')
    .eq('restaurant_id', restaurant.id)
    .in('status', ['placed', 'confirmed', 'preparing', 'ready_for_pickup'])
    .gte('placed_at', todayStart.toISOString())
    .order('placed_at', { ascending: true });

  return (
    <KdsBoard
      restaurant={restaurant}
      initialOrders={orders ?? []}
    />
  );
}
