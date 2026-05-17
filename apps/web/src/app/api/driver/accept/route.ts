// Driver claims a delivery. Uses a conditional UPDATE to avoid two
// drivers racing for the same order.

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/notifications/expo-push';

export async function POST(req: Request) {
  const { order_id } = await req.json();
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: claimed, error } = await admin
    .from('orders')
    .update({
      driver_id: user.id,
      driver_assigned_at: new Date().toISOString(),
      driver_accepted_at: new Date().toISOString(),
    })
    .eq('id', order_id)
    .is('driver_id', null)
    .select()
    .single();

  if (error || !claimed) {
    return NextResponse.json({ error: 'Order is no longer available' }, { status: 409 });
  }

  await admin.from('order_status_history').insert({
    order_id,
    status: claimed.status,
    notes: 'Driver assigned',
    changed_by: user.id,
  });

  // Notify the customer that a driver is on it.
  if (claimed.customer_id) {
    await sendPushToUser(claimed.customer_id, {
      title: 'A driver has been assigned',
      body: `Your order ${claimed.order_number} will be on its way soon.`,
      data: { order_id: claimed.id, kind: 'order_update' },
      sound: 'default',
      channelId: 'default',
      priority: 'high',
    });
  }

  return NextResponse.json({ ok: true, order: claimed });
}
