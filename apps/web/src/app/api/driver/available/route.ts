// List delivery orders that are unassigned + ready, plus any orders
// already assigned to the current driver.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Available: order_type=delivery, status in (preparing, ready_for_pickup),
  // driver_id is null, restaurant is one the driver is a member of.
  const { data: memberRestaurants } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .eq('role', 'driver')
    .eq('is_active', true);

  const restaurantIds = (memberRestaurants ?? []).map((m) => m.restaurant_id);

  const [available, mine] = await Promise.all([
    restaurantIds.length
      ? supabase
          .from('orders')
          .select('id, order_number, restaurant_id, grand_total, currency, slot_start, delivery_address_snapshot, restaurants(name, slug)')
          .eq('order_type', 'delivery')
          .in('status', ['preparing', 'ready_for_pickup'])
          .in('restaurant_id', restaurantIds)
          .is('driver_id', null)
          .order('slot_start', { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('orders')
      .select('id, order_number, restaurant_id, grand_total, currency, status, slot_start, delivery_address_snapshot, customer_id, guest_phone, restaurants(name, slug)')
      .eq('driver_id', user.id)
      .in('status', ['ready_for_pickup', 'out_for_delivery'])
      .order('slot_start', { ascending: true }),
  ]);

  return NextResponse.json({
    available: available.data ?? [],
    active: mine.data ?? [],
  });
}
