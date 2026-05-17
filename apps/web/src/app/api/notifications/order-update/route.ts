// Send a push notification to the customer when an order's status changes.
// Called from the admin status-select after writing the new status.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/notifications/expo-push';

const FRIENDLY: Record<string, string> = {
  confirmed: 'Your order has been confirmed',
  preparing: 'Your order is being prepared',
  ready_for_pickup: 'Your order is ready for pickup',
  out_for_delivery: 'Your order is out for delivery',
  completed: 'Your order is complete — enjoy!',
  canceled: 'Your order was canceled',
};

export async function POST(req: Request) {
  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

  const admin = await createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('id, order_number, status, customer_id, restaurant_id, restaurants(name)')
    .eq('id', order_id)
    .single();

  if (!order?.customer_id) return NextResponse.json({ ok: true, skipped: 'guest order' });
  const message = FRIENDLY[order.status];
  if (!message) return NextResponse.json({ ok: true, skipped: 'no message for status' });

  await admin.from('notifications').insert({
    user_id: order.customer_id,
    restaurant_id: order.restaurant_id,
    kind: 'order_update',
    channel: 'push',
    title: (order as any).restaurants?.name ?? 'Order update',
    body: message,
    data: { order_id: order.id, status: order.status },
    sent_at: new Date().toISOString(),
  });

  const tickets = await sendPushToUser(order.customer_id, {
    title: (order as any).restaurants?.name ?? 'Order update',
    body: message,
    data: { order_id: order.id, status: order.status, kind: 'order_update' },
    sound: 'default',
    channelId: 'default',
    priority: 'high',
  });

  return NextResponse.json({ ok: true, sent: tickets.filter((t) => t.status === 'ok').length });
}
